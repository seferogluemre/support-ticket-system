import prisma from '@onlyjs/db';
import type { Role } from '@onlyjs/db/client';
import { organizationRegistry } from '../organizations';
import type { RoleResponseDto } from './types';

/**
 * Role formatters - Response'lardan numeric ID'leri gizler, UUID'lere çevirir
 */
export abstract class RoleFormatter {
  /**
   * 🔒 Single role response - organizationId → organizationUuid
   */
  static async response(role: Role): Promise<RoleResponseDto> {
    let organizationUuid: string | null = null;

    // 🔒 organizationId'yi UUID'ye çevir
    if (role.organizationType && role.organizationId) {
      const adapter = organizationRegistry.get(role.organizationType);
      if (adapter) {
        organizationUuid = await adapter.getOrganizationUuid(role.organizationId);
      }
    }

    return {
      uuid: role.uuid,
      name: role.name,
      type: role.type,
      description: role.description,
      permissions: role.permissions as string[],
      organizationType: role.organizationType,
      organizationUuid,
      order: role.order,
      // organizationId: NEVER exposed! ❌
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * 🔒 Multiple roles response - Batch UUID conversion
   */
  static async responseList(
    roles: (Role & {
      userRoles?: Array<{
        id: number;
        userId: string;
        user: { id: string; name: string; image: string | null };
      }>;
    })[],
  ): Promise<RoleResponseDto[]> {
    // Performance: Batch UUID conversion
    const orgIdsByType: Record<string, Set<number>> = {};

    // Group organization IDs by type
    for (const role of roles) {
      if (role.organizationType && role.organizationId) {
        if (!orgIdsByType[role.organizationType]) {
          orgIdsByType[role.organizationType] = new Set();
        }
        orgIdsByType[role.organizationType]!.add(role.organizationId);
      }
    }

    // Batch fetch UUIDs
    const uuidMappings: Record<string, Record<number, string>> = {};
    await Promise.all(
      Object.entries(orgIdsByType).map(async ([orgType, orgIds]) => {
        const adapter = organizationRegistry.get(orgType);
        if (adapter) {
          // Fallback to single calls if batch method not available
          if (adapter.getOrganizationUuids) {
            uuidMappings[orgType] = await adapter.getOrganizationUuids(Array.from(orgIds));
          } else {
            // Fallback: Call getOrganizationUuid for each ID
            uuidMappings[orgType] = {};
            for (const orgId of orgIds) {
              const uuid = await adapter.getOrganizationUuid(orgId);
              if (uuid) {
                uuidMappings[orgType][orgId] = uuid;
              }
            }
          }
        }
      }),
    );

    // Map roles to response DTOs
    return Promise.all(
      roles.map(async (role) => {
        let organizationUuid: string | null = null;

        if (role.organizationType && role.organizationId) {
          organizationUuid = uuidMappings[role.organizationType]?.[role.organizationId] || null;
        }

        // Member preview ve count hesapla
        let memberCount = 0;
        const memberPreview: Array<{ uuid: string; name: string; image: string | null }> = [];

        if (role.userRoles) {
          // Total member count'u al (userRoles sadece ilk 5'i içeriyor)
          memberCount = await prisma.userRole.count({
            where: { roleId: role.id },
          });

          // İlk 5 member'ı preview için kullan
          memberPreview.push(
            ...role.userRoles.slice(0, 5).map((ur) => ({
              uuid: ur.user.id, // User.id is UUID
              name: ur.user.name,
              image: ur.user.image,
            })),
          );
        }

        return {
          uuid: role.uuid,
          name: role.name,
          type: role.type,
          description: role.description,
          permissions: role.permissions as string[],
          organizationType: role.organizationType,
          organizationUuid,
          order: role.order,
          memberCount,
          memberPreview: memberPreview.length > 0 ? memberPreview : undefined,
          // organizationId: NEVER exposed! ❌
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        };
      }),
    );
  }
}
