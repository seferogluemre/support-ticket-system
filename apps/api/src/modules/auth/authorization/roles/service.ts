import { cache } from '#core';
import prisma from '@onlyjs/db';
import { Prisma, type Role, type User } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { RoleType } from '@onlyjs/db/enums';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../../utils';
import { generateUserClaims, invalidateClaimsForRole, matchesWildcard } from '../claims';
import { organizationRegistry } from '../organizations';
import type { OrganizationType } from '@onlyjs/db/enums';
import { PERMISSIONS } from '../permissions/constants';
import type { PermissionKey } from '../permissions/types';
import { validatePermissionsForOrganizationType } from '../permissions/validators';
import { filterRoles } from './dtos';
import { RoleValidationService } from './role-validation.service';
import type { RoleCreatePayload, RoleIndexQuery, RoleUpdatePayload } from './types';

const ROLES_CACHE_KEY = 'roles';
const ROLE_CACHE_KEY = (slugOrUuid: string) => `role:${slugOrUuid}`;

export abstract class RolesService {
  static async clearCache() {
    try {
      // Roles listesi cache'ini sil
      await cache.del(ROLES_CACHE_KEY);

      // Tüm individual role cache'lerini sil (pattern ile)
      await cache.del('role:*');
    } catch (error) {
      console.error('Error clearing roles cache:', error);
      // Cache temizleme hatası role güncellemesini engellememelidir
    }
  }

  /**
   * Rolleri listeler
   * @param query Filter parametreleri
   * @param currentUser 🛡️ Yetki bazlı filtreleme için (opsiyonel)
   */
  static async index(query?: RoleIndexQuery, currentUser?: User) {
    // Query'ye göre where condition oluştur
    const whereCondition: Prisma.RoleWhereInput = {};

    // Scope filter
    if (query && 'scope' in query) {
      if (query.scope === 'global') {
        whereCondition.organizationType = null;
      } else if (query.scope === 'organization') {
        whereCondition.organizationType = { not: null };
      }
    }

    // 🔒 Organization filter (UUID → ID conversion)
    if (query && query.organizationType) {
      whereCondition.organizationType = query.organizationType;
    }
    if (query && query.organizationUuid && query.organizationType) {
      // UUID → ID mapping
      const adapter = organizationRegistry.get(query.organizationType);
      if (adapter) {
        const orgId = await adapter.getOrganizationId(query.organizationUuid);
        if (orgId) {
          whereCondition.organizationId = orgId;
        } else {
          // UUID geçersiz - hiç sonuç dönmesin
          whereCondition.organizationId = -1;
        }
      }
    }

    const roles = await prisma.role.findMany({
      where: whereCondition,
      include: {
        // Member preview için UserRole'leri ve User'ları getir
        userRoles: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 5, // İlk 5 member'ı al (preview için)
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 🛡️ ROW-LEVEL SECURITY: Kullanıcının erişebildiği rolleri filtrele
    let accessibleRoles = roles;
    if (currentUser) {
      accessibleRoles = await this.filterRolesByUserAccess(roles, currentUser);
    }

    // 🆕 Advanced filters uygula
    if (query) {
      const rolesWithUserRoles = accessibleRoles as (Role & { userRoles?: { id: number }[] })[];
      const filtered = this.applyAdvancedFilters(rolesWithUserRoles, query);
      accessibleRoles = filtered as typeof accessibleRoles;
    }

    // Standard filters (search, date, vb.)
    const result = filterRoles(accessibleRoles, query);

    return result;
  }

  /**
   * 🆕 Advanced filtreleri uygula (permission, member count, vb.)
   */
  private static applyAdvancedFilters(
    roles: (Role & { userRoles?: { id: number }[] })[],
    query: RoleIndexQuery,
  ): (Role & { userRoles?: { id: number }[] })[] {
    let filtered = roles;

    // Permission filters
    if (query && 'hasPermission' in query && query.hasPermission) {
      filtered = filtered.filter((role) => {
        const permissions = role.permissions as string[];
        return permissions.includes('*') || permissions.includes(query.hasPermission!);
      });
    }

    if (query && 'hasAnyPermission' in query && query.hasAnyPermission) {
      filtered = filtered.filter((role) => {
        const permissions = role.permissions as string[];
        if (permissions.includes('*')) return true;
        return query.hasAnyPermission!.some((p) => permissions.includes(p));
      });
    }

    if (query && 'hasAllPermissions' in query && query.hasAllPermissions) {
      filtered = filtered.filter((role) => {
        const permissions = role.permissions as string[];
        if (permissions.includes('*')) return true;
        return query.hasAllPermissions!.every((p) => permissions.includes(p));
      });
    }

    // Member count filters
    if (query && 'minMembers' in query && typeof query.minMembers === 'number') {
      filtered = filtered.filter((role) => {
        const memberCount = role.userRoles?.length || 0;
        return memberCount >= query.minMembers!;
      });
    }

    if (query && 'maxMembers' in query && typeof query.maxMembers === 'number') {
      filtered = filtered.filter((role) => {
        const memberCount = role.userRoles?.length || 0;
        return memberCount <= query.maxMembers!;
      });
    }

    return filtered;
  }

  /**
   * 🛡️ GUARDRAIL: Kullanıcının erişebildiği rolleri filtreler
   * - Global ROLES.SHOW yetkisi varsa → Tüm rolleri görebilir
   * - Yoksa → Sadece erişebildiği organization'ların rollerini görebilir
   */
  /**
   * 🛡️ Kullanıcının erişim yetkisine göre rolleri filtreler (LIST için)
   *
   * Mantık:
   * 1. Global wildcard (*) → Tüm rolleri görebilir
   * 2. LIST_GLOBALS → Global rolleri listeleyebilir
   * 3. LIST_ALL_ORGANIZATIONS → Tüm org rollerini listeleyebilir
   * 4. Organization üyesi → O organization'ın rollerini listeleyebilir (permission gerekmez)
   */
  private static async filterRolesByUserAccess<T extends Role>(
    roles: T[],
    currentUser: User,
  ): Promise<T[]> {
    const claims = await generateUserClaims(currentUser.id);

    // Wildcard yetkisi varsa tüm rolleri görebilir
    if (claims.global.includes('*')) {
      return roles;
    }

    // Check global permissions
    const canListGlobals = claims.global.some((perm) =>
      matchesWildcard(PERMISSIONS.ROLE_VIEW.LIST_GLOBALS.key, perm),
    );
    const canListAllOrgs = claims.global.some((perm) =>
      matchesWildcard(PERMISSIONS.ROLE_VIEW.LIST_ALL_ORGANIZATIONS.key, perm),
    );

    // Eğer her ikisi de varsa tüm rolleri görebilir
    if (canListGlobals && canListAllOrgs) {
      return roles;
    }

    // Kullanıcının üye olduğu organization'ları bul (herhangi bir permission varsa üyedir)
    const memberOrganizations = new Set<string>();

    for (const [orgType, orgs] of Object.entries(claims.organizations)) {
      for (const [orgUuid, permissions] of Object.entries(orgs)) {
        // Bu organization'a üye (herhangi bir permission varsa)
        if (permissions.length > 0) {
          // UUID -> Internal ID mapping
          const adapter = organizationRegistry.get(orgType);
          if (adapter) {
            const orgId = await adapter.getOrganizationId(orgUuid);
            if (orgId) {
              memberOrganizations.add(`${orgType}:${orgId}`);
            }
          }
        }
      }
    }

    // Rolleri filtrele
    return roles.filter((role) => {
      // Global rol
      if (!role.organizationType) {
        return canListGlobals;
      }

      // Organization rolü
      const orgKey = `${role.organizationType}:${role.organizationId}`;

      // LIST_ALL_ORGANIZATIONS permission'ı varsa veya bu org'a üyeyse görebilir
      return canListAllOrgs || memberOrganizations.has(orgKey);
    });
  }

  /**
   * Get role by UUID
   * @param uuid Role UUID
   * @param currentUser Current user (for row-level security)
   */
  static async show(uuid: string, currentUser?: User) {
    const cacheKey = ROLE_CACHE_KEY(uuid);

    // Try cache first
    const cachedRole = await cache.get<Role>(cacheKey);
    if (cachedRole) {
      // 🛡️ Row-level security check (even for cached)
      if (currentUser) {
        await RoleValidationService.ensureUserCanAccessRole(cachedRole, currentUser);
      }
      return cachedRole;
    }

    // Fetch from database
    const role = await prisma.role.findUnique({ where: { uuid } });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // 🛡️ Row-level security check
    if (currentUser) {
      await RoleValidationService.ensureUserCanAccessRole(role, currentUser);
    }

    // Cache by uuid
    await cache.set(ROLE_CACHE_KEY(role.uuid), role, 3600); // 1 saat cache
    return role;
  }

  static async store(payload: RoleCreatePayload, currentUser?: User) {
    try {
      // 🔒 organizationType ve organizationUuid validation
      if (payload.organizationType && !payload.organizationUuid) {
        throw new BadRequestException(
          'organizationType belirtildiğinde organizationUuid de gereklidir',
        );
      }
      if (!payload.organizationType && payload.organizationUuid) {
        throw new BadRequestException(
          'organizationUuid belirtildiğinde organizationType de gereklidir',
        );
      }

      // 🔒 UUID → ID conversion
      let organizationId: number | null = null;
      if (payload.organizationUuid && payload.organizationType) {
        const adapter = organizationRegistry.get(payload.organizationType);
        if (!adapter) {
          throw new BadRequestException(`Geçersiz organization türü: ${payload.organizationType}`);
        }
        organizationId = await adapter.getOrganizationId(payload.organizationUuid);
        if (!organizationId) {
          throw new NotFoundException(`Organization bulunamadı: ${payload.organizationUuid}`);
        }
      }

      // Permission validation
      validatePermissionsForOrganizationType(
        payload.permissions as PermissionKey[],
        payload.organizationType ?? null,
      );

      // 🛡️ GUARDRAIL: Current user sahip olmadığı yetkileri role ekleyemez
      if (currentUser) {
        await RoleValidationService.validateUserCanGrantPermissions(
          currentUser,
          payload.permissions as PermissionKey[],
        );
      }

      // 🛡️ Permission Check: CREATE permission control
      if (currentUser) {
        await RoleValidationService.ensureUserCanCreateRole(
          payload.organizationType ?? null,
          organizationId,
          currentUser,
        );
      }

      // 🎯 Role Hierarchy Check: User can only create roles with order < their highest role
      const roleOrder = payload.order ?? 0;
      if (currentUser) {
        const userHighestOrder = await RoleValidationService.getUserHighestRoleOrder(
          currentUser.id,
          payload.organizationType ?? null,
          organizationId,
        );

        if (userHighestOrder !== null && roleOrder >= userHighestOrder) {
          throw new ForbiddenException(
            `Kendi en yüksek rolünüzden (order: ${userHighestOrder}) daha güçlü veya eşit güçte rol oluşturamazsınız (istenen order: ${roleOrder})`,
          );
        }
      }

      // ✅ Unique constraint check: Name zaten kullanılıyor mu?
      const existingRole = await prisma.role.findFirst({
        where: {
          name: payload.name,
          organizationType: payload.organizationType ?? null,
          organizationId,
        },
      });

      if (existingRole) {
        throw new ConflictException(
          `Bu rol adı zaten kullanılıyor: ${payload.name}${payload.organizationType ? ` (${payload.organizationType})` : ''}`,
        );
      }

      const role = await prisma.role.create({
        data: {
          name: payload.name,
          description: payload.description,
          permissions: payload.permissions,
          organizationType: payload.organizationType ?? null,
          organizationId,
          organizationUuid: payload.organizationUuid ?? null,
          order: roleOrder,
          type: RoleType.CUSTOM, // ✅ All user-created roles are CUSTOM (BASIC/ADMIN are system roles)
        },
      });

      await this.clearCache();
      return role;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Bu rol adı zaten kullanılıyor');
        }
      }
      throw error;
    }
  }

  static async update(uuid: string, payload: RoleUpdatePayload, currentUser?: User) {
    try {
      const role = await prisma.role.findUnique({
        where: { uuid },
        select: {
          id: true,
          name: true,
          type: true, // ✅ For type-based validation
          order: true, // ✅ For hierarchy check
          organizationType: true,
          organizationId: true,
          permissions: true,
          userRoles: { select: { id: true } },
        },
      });

      if (!role) {
        throw new NotFoundException('Rol bulunamadı');
      }

      // 🛡️ ADMIN ve BASIC rolleri için özel kurallar
      // - ADMIN: name, description güncellenebilir (permissions wildcard'da kalmalı)
      // - BASIC: name, description, permissions güncellenebilir (esnek)
      // - Her iki tip için: type, order, organizationType korunur
      if (role.type === 'ADMIN' || role.type === 'BASIC') {
        const allowedKeys =
          role.type === 'ADMIN'
            ? ['name', 'description'] // ADMIN: sadece isim ve açıklama
            : ['name', 'description', 'permissions']; // BASIC: isim, açıklama ve yetkiler

        const providedKeys = Object.keys(payload).filter(
          (k) => payload[k as keyof typeof payload] !== undefined,
        );
        const hasDisallowedUpdate = providedKeys.some((k) => !allowedKeys.includes(k));

        if (hasDisallowedUpdate) {
          const message =
            role.type === 'ADMIN'
              ? 'Admin rol sadece isim ve açıklama güncellenebilir. Yetkiler, tip ve sıralama sistem tarafından korunmaktadır.'
              : 'Temel rol sadece isim, açıklama ve yetkiler güncellenebilir. Tip ve sıralama sistem tarafından korunmaktadır.';
          throw new BadRequestException(message);
        }
      }

      // 🛡️ Permission + Hierarchy Check: User can modify this role?
      if (currentUser) {
        await RoleValidationService.ensureUserCanModifyRole(role, currentUser, 'update');
      }

      // Permission validation (if permissions are being updated)
      if (payload.permissions !== undefined) {
        const permissionsToValidate = payload.permissions as PermissionKey[];
        const orgTypeToValidate = role.organizationType;

        validatePermissionsForOrganizationType(
          permissionsToValidate,
          orgTypeToValidate as OrganizationType | null,
        );

        // 🛡️ GUARDRAIL: Current user sahip olmadığı yetkileri role ekleyemez
        if (currentUser) {
          await RoleValidationService.validateUserCanGrantPermissions(
            currentUser,
            permissionsToValidate,
          );
        }
      }

      // 🎯 Order update check: User cannot set order >= their highest role
      if (payload.order !== undefined && currentUser) {
        const userHighestOrder = await RoleValidationService.getUserHighestRoleOrder(
          currentUser.id,
          role.organizationType,
          role.organizationId,
        );

        if (userHighestOrder !== null && payload.order >= userHighestOrder) {
          throw new ForbiddenException(
            `Bir role kendi en yüksek rolünüzden (order: ${userHighestOrder}) daha güçlü veya eşit order atayamazsınız (istenen: ${payload.order})`,
          );
        }
      }

      const updateData: Record<string, unknown> = {
        name: payload.name,
        description: payload.description,
        permissions: payload.permissions,
        order: payload.order, // ✅ Role hierarchy update
      };

      // Note: organizationType and organizationId cannot be changed after role creation

      const updatedRole = await prisma.role.update({
        where: { uuid },
        data: updateData,
      });

      // ✅ Role değiştiğinde o role sahip kullanıcıların claims'lerini invalidate et
      // Lazy loading: Her kullanıcı ihtiyaç anında claims'leri yeniden hesaplanacak
      await invalidateClaimsForRole(role.id);
      await this.clearCache();
      return updatedRole;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Rol bulunamadı');
        }
      }
      throw error;
    }
  }

  static async destroy(uuid: string, currentUser?: User) {
    try {
      const role = await prisma.role.findUnique({
        where: { uuid },
        select: {
          id: true,
          type: true, // ✅ For type validation (BASIC/ADMIN cannot be deleted)
          order: true, // ✅ For hierarchy check
          organizationType: true,
          organizationId: true,
          userRoles: { select: { id: true } },
        },
      });

      if (!role) {
        throw new NotFoundException('Rol bulunamadı');
      }

      // 🛡️ BASIC ve ADMIN rolleri silinemez (type-based protection)
      if (role.type === 'BASIC' || role.type === 'ADMIN') {
        throw new BadRequestException(
          `${role.type === 'BASIC' ? 'Temel' : 'Admin'} rolü silinemez. Bu rol sistem tarafından korunmaktadır.`,
        );
      }

      // 🛡️ Permission + Hierarchy Check: User can delete this role?
      if (currentUser) {
        await RoleValidationService.ensureUserCanModifyRole(role, currentUser, 'delete');
      }

      // ✅ Role silinmeden ÖNCE o role sahip kullanıcıların claims'lerini invalidate et
      // Lazy loading: Her kullanıcı ihtiyaç anında claims'leri yeniden hesaplanacak
      await invalidateClaimsForRole(role.id);

      await prisma.role.delete({
        where: { uuid },
      });

      await this.clearCache();
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Rol bulunamadı');
        }
      }
      throw error;
    }
  }

  /**
   * Role'e atanmış kullanıcıları döndürür
   * @param uuid Role UUID
   */
  static async getRoleMembers(uuid: string) {
    const role = await prisma.role.findUnique({
      where: { uuid },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // UserRole'leri bul ve ilişkili kullanıcıları getir
    const userRoles = await prisma.userRole.findMany({
      where: {
        roleId: role.id,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    // Kullanıcıları ayrı sorguda getir
    const userIds = userRoles.map((ur) => ur.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    // Map ile birleştir
    return userRoles.map((ur) => {
      const user = users.find((u) => u.id === ur.userId)!;
      return {
        uuid: user.id, // User.id aslında uuid
        name: user.name,
        email: user.email,
        image: user.image,
        assignedAt: ur.createdAt,
      };
    });
  }

  /**
   * 🎯 Batch Reorder Roles
   * Atomically updates multiple role orders
   * @param updates Array of role UUID + new order
   * @param currentUser User performing the reorder
   * @param organizationType Organization type (null = global)
   * @param organizationUuid Organization UUID (null = global)
   */
  static async reorderRoles(
    updates: Array<{ uuid: string; order: number }>,
    currentUser: User,
    organizationType?: OrganizationType | null,
    organizationUuid?: string | null,
  ): Promise<number> {
    // 🔒 UUID → ID conversion for organization
    let organizationId: number | null = null;
    if (organizationUuid && organizationType) {
      const adapter = organizationRegistry.get(organizationType);
      if (!adapter) {
        throw new BadRequestException(`Geçersiz organization türü: ${organizationType}`);
      }
      organizationId = await adapter.getOrganizationId(organizationUuid);
      if (!organizationId) {
        throw new NotFoundException(`Organization bulunamadı: ${organizationUuid}`);
      }
    }

    // Fetch all target roles to validate
    const roleUuids = updates.map((u) => u.uuid);
    const roles = await prisma.role.findMany({
      where: {
        uuid: { in: roleUuids },
        organizationType: organizationType ?? null,
        organizationId,
      },
      select: {
        id: true,
        uuid: true,
        order: true,
        organizationType: true,
        organizationId: true,
      },
    });

    if (roles.length !== updates.length) {
      throw new NotFoundException("Bazı roller bulunamadı veya farklı hierarchy'de");
    }

    // 🛡️ Permission Check: REORDER permission required for reordering
    await RoleValidationService.ensureUserCanReorderRoles(
      organizationType ?? null,
      organizationId,
      currentUser,
    );

    // Get user's highest role order in this hierarchy
    const userHighestOrder = await RoleValidationService.getUserHighestRoleOrder(
      currentUser.id,
      organizationType ?? null,
      organizationId,
    );

    if (userHighestOrder === null) {
      throw new ForbiddenException(
        'Bu hiyerarşide role yönetmek için gerekli yetkiye sahip değilsiniz',
      );
    }

    // Validate all target roles & new orders
    for (const update of updates) {
      const role = roles.find((r) => r.uuid === update.uuid);
      if (!role) continue;

      // User can only reorder roles with order < their highest role
      if (role.order >= userHighestOrder) {
        throw new ForbiddenException(
          `Bu role (order: ${role.order}) yönetmek için yeterli yetkiniz yok (sizin en yüksek: ${userHighestOrder})`,
        );
      }

      // User cannot assign order >= their highest role
      if (update.order >= userHighestOrder) {
        throw new ForbiddenException(
          `Bir role kendi en yüksek rolünüzden (${userHighestOrder}) daha yüksek veya eşit order atayamazsınız (istenen: ${update.order})`,
        );
      }
    }

    // Check for duplicate orders in updates
    const orderCounts = new Map<number, number>();
    for (const update of updates) {
      orderCounts.set(update.order, (orderCounts.get(update.order) || 0) + 1);
    }
    const duplicates = Array.from(orderCounts.entries()).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Aynı order birden fazla role atayamazsınız: ${duplicates.map(([order]) => order).join(', ')}`,
      );
    }

    // Check if any of the new orders conflict with existing roles (not in update list)
    const existingRolesWithConflicts = await prisma.role.findMany({
      where: {
        uuid: { notIn: roleUuids },
        order: { in: updates.map((u) => u.order) },
        organizationType: organizationType ?? null,
        organizationId,
      },
      select: { order: true, name: true },
    });

    if (existingRolesWithConflicts.length > 0) {
      const conflicts = existingRolesWithConflicts.map((r) => `${r.name} (order: ${r.order})`);
      throw new ConflictException(
        `Bu order değerleri başka rollerle çakışıyor: ${conflicts.join(', ')}. Önce o rolleri yeniden sıralayın.`,
      );
    }

    // Execute updates in a transaction (batch update)
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.role.update({
          where: { uuid: update.uuid },
          data: { order: update.order },
        });
      }
    });

    // ℹ️ NO CLAIMS INVALIDATION NEEDED:
    // Order değişimi sadece hierarchy validation'ı etkiler (kim kimi yönetebilir)
    // Permission calculation'da order kullanılmaz, sadece role.permissions kullanılır
    // Claims invalidation sadece şu durumlarda gerekli:
    // - Role permissions değiştiğinde (update metodu)
    // - Role silindiğinde (destroy metodu)
    // - User'a rol atandığında/kaldırıldığında (RoleAssignmentService)

    await this.clearCache();
    return updates.length;
  }
}
