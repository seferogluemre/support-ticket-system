import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '#utils';
import prisma from '@onlyjs/db';
import type { User } from '@onlyjs/db/client';
import { refreshUserClaims } from '../claims';
import { organizationRegistry } from '../organizations';
import type { OrganizationType } from '@onlyjs/db/enums';
import { getUserPermissions } from '../permissions/checks';
import type { PermissionKey } from '../permissions/types';
import { validatePermissionsForOrganizationType } from '../permissions/validators';
import type { AddPermissionPayload, DirectPermissionDto } from './types';

export abstract class UserPermissionsService {
  /**
   * Kullanıcının tüm permission'larını döndürür (global + organization-specific)
   */
  static async getUserPermissions(userId: string): Promise<{
    global: PermissionKey[];
    organizations: Record<string, Record<string, PermissionKey[]>>;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // User.id = UUID
      select: {
        id: true,
        claims: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // claims'den döndür (cache'lenmiş)
    const claims = user.claims as {
      global: PermissionKey[];
      organizations: Record<string, Record<string, PermissionKey[]>>;
    } | null;

    return claims || { global: [], organizations: {} };
  }

  /**
   * Kullanıcıya doğrudan permission ekler
   * @param userId Kullanıcı UUID
   * @param data Permission bilgileri (UUID-based)
   * @param currentUser İşlemi yapan kullanıcı (guardrail için)
   */
  static async addPermission(
    userId: string,
    data: AddPermissionPayload,
    currentUser: User,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // User.id = UUID
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Permission validation
    validatePermissionsForOrganizationType(
      [data.permissionCode],
      (data.organizationType as OrganizationType | null) ?? null,
    );

    // organizationType ve organizationUuid validation
    if (data.organizationType && !data.organizationUuid) {
      throw new BadRequestException(
        'organizationType belirtildiğinde organizationUuid de gereklidir',
      );
    }
    if (!data.organizationType && data.organizationUuid) {
      throw new BadRequestException(
        'organizationUuid belirtildiğinde organizationType de gereklidir',
      );
    }

    // 🔒 UUID → ID conversion
    let organizationId: number | null = null;
    if (data.organizationUuid && data.organizationType) {
      const adapter = organizationRegistry.get(data.organizationType);
      if (!adapter) {
        throw new BadRequestException(`Geçersiz organization türü: ${data.organizationType}`);
      }
      organizationId = await adapter.getOrganizationId(data.organizationUuid);
      if (!organizationId) {
        throw new NotFoundException(`Organization bulunamadı: ${data.organizationUuid}`);
      }
    }

    // 🛡️ GUARDRAIL: Current user sahip olmadığı yetkiyi veremez
    await this.validateUserCanGrantPermission(currentUser, data.permissionCode);

    const existingPermission = await prisma.userPermission.findFirst({
      where: {
        userId: user.id,
        permissionCode: data.permissionCode,
        organizationType: data.organizationType ?? null,
        organizationId,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Bu permission kullanıcıda zaten var: ${data.permissionCode}${data.organizationType ? ` (${data.organizationType})` : ''}`
      );
    }

    // UserPermission oluştur
    await prisma.userPermission.create({
      data: {
        userId: user.id,
        permissionCode: data.permissionCode,
        organizationType: data.organizationType ?? null,
        organizationId, // ✅ Converted from UUID
      },
    });

    // Claim'leri yenile
    await refreshUserClaims(user.id);
  }

  /**
   * Kullanıcıdan doğrudan permission kaldırır
   */
  static async removePermission(
    userId: string,
    permissionCode: string,
    organizationType?: OrganizationType | null,
    organizationUuid?: string | null,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // User.id = UUID
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // 🔒 UUID → ID conversion
    let organizationId: number | null | undefined = undefined;
    if (organizationUuid && organizationType) {
      const adapter = organizationRegistry.get(organizationType);
      if (!adapter) {
        throw new BadRequestException(`Geçersiz organization türü: ${organizationType}`);
      }
      organizationId = await adapter.getOrganizationId(organizationUuid);
      if (!organizationId) {
        throw new NotFoundException(`Organization bulunamadı: ${organizationUuid}`);
      }
    } else if (organizationType || organizationUuid) {
      // Tek biri girilmişse hata
      throw new BadRequestException(
        'organizationType ve organizationUuid birlikte belirtilmelidir',
      );
    } else {
      // İkisi de girilmemişse, null kullan (global permission)
      organizationId = null;
    }

    // UserPermission bul ve sil
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId: user.id,
        permissionCode,
        organizationType: organizationType ?? null,
        organizationId: organizationId ?? null,
      },
    });

    if (!userPermission) {
      throw new NotFoundException('Bu kullanıcıda bu permission bulunamadı');
    }

    await prisma.userPermission.delete({
      where: { id: userPermission.id },
    });

    // Claim'leri yenile
    await refreshUserClaims(user.id);
  }

  /**
   * Kullanıcının tüm doğrudan atanmış permission'larını listeler (UUID-based response)
   */
  static async listDirectPermissions(userId: string): Promise<DirectPermissionDto[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // User.id = UUID
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const permissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      select: {
        permissionCode: true,
        organizationType: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 🔒 ID → UUID conversion
    const result = await Promise.all(
      permissions.map(async (perm) => {
        let organizationUuid: string | null = null;

        if (perm.organizationType && perm.organizationId) {
          const adapter = organizationRegistry.get(perm.organizationType);
          if (adapter) {
            organizationUuid = await adapter.getOrganizationUuid(perm.organizationId);
          }
        }

        return {
          permissionCode: perm.permissionCode,
          organizationType: perm.organizationType,
          organizationUuid,
          createdAt: perm.createdAt,
        };
      }),
    );

    return result;
  }

  /**
   * 🛡️ GUARDRAIL: Kullanıcının vermeye çalıştığı yetkiye sahip olup olmadığını kontrol eder
   */
  private static async validateUserCanGrantPermission(
    currentUser: User,
    permissionCode: PermissionKey,
  ): Promise<void> {
    const userPermissions = await getUserPermissions(currentUser);

    // Wildcard kontrolü
    if (userPermissions.includes('*')) {
      return;
    }

    // Permission kontrolü
    if (!userPermissions.includes(permissionCode)) {
      throw new ForbiddenException(`Sahip olmadığınız yetkiyi veremezsiniz: ${permissionCode}`);
    }
  }
}
