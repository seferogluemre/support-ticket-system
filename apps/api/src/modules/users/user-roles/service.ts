import { invalidateUserClaimsAndRoles } from '#modules/auth/authorization/claims/service';
import { organizationRegistry } from '#modules/auth/authorization/organizations';
import { RoleAssignmentService } from '#modules/auth/authorization/roles/role-assignment.service';
import { RoleValidationService } from '#modules/auth/authorization/roles/role-validation.service';
import { isValidUuid } from '#utils';
import { BadRequestException, ForbiddenException, NotFoundException } from '#utils/http-errors';
import prisma from '@onlyjs/db';
import type { Prisma, User } from '@onlyjs/db/client';
import type { PermissionKey } from '../../auth/authorization/permissions/types';
import type { UserRoleUpdatePayload } from './types';
import type { OrganizationType } from '@onlyjs/db/enums';

/**
 * Minimum user data required for role validation
 */
interface CurrentUserForValidation {
  id: string;
}

export abstract class UserRolesService {
  /**
   * Validate and resolve roles from UUIDs
   * @private
   */
  private static async validateAndResolveRoles(
    roleUuids: string[],
    currentUser: CurrentUserForValidation,
    scope: {
      organizationType: OrganizationType;
      organizationId: number;
    } | null,
    tx: Prisma.TransactionClient,
    skipValidation = false,
  ): Promise<
    Array<{
      id: number;
      order: number;
      permissions: unknown;
      organizationType: OrganizationType | null;
      organizationId: number | null;
    }>
  > {
    const isGlobalScope = scope === undefined || scope === null;
    const resolvedRoles: Array<{
      id: number;
      order: number;
      permissions: unknown;
      organizationType: OrganizationType | null;
      organizationId: number | null;
    }> = [];

    // Fetch current user once for all validations
    const fullCurrentUser = await tx.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!fullCurrentUser) {
      throw new NotFoundException('Current user not found');
    }

    for (const roleUuid of roleUuids) {
      // 🔒 SECURITY: Only accept UUIDs, no slug support
      if (!isValidUuid(roleUuid)) {
        throw new BadRequestException(`Invalid role UUID format: ${roleUuid}`);
      }

      // Find role by UUID
      const role: {
        id: number;
        order: number;
        permissions: unknown;
        organizationType: OrganizationType | null;
        organizationId: number | null;
      } | null = await tx.role.findUnique({
        where: { uuid: roleUuid },
        select: {
          id: true,
          order: true,
          permissions: true,
          organizationType: true,
          organizationId: true,
        },
      });

      if (!role) {
        throw new NotFoundException(`Rol bulunamadı: ${roleUuid}`);
      }

      // Ensure role belongs to the correct scope
      if (isGlobalScope) {
        if (role.organizationType !== null || role.organizationId !== null) {
          throw new BadRequestException(`Bu rol global bir rol değil: ${roleUuid}`);
        }
      } else {
        if (
          role.organizationType !== scope.organizationType ||
          role.organizationId !== scope.organizationId
        ) {
          throw new BadRequestException(
            `Rol bu ${scope.organizationType} organizasyonuna ait değil: ${roleUuid}`,
          );
        }
      }

      // 🛡️ PERMISSION CHECK: Can current user manage this role assignment?
      if (!skipValidation) {
        await RoleAssignmentService.ensureUserCanManageRoleAssignment(
          role,
          currentUser.id,
          fullCurrentUser,
        );

        // 🔍 Check if hierarchy should be skipped for global permissions
        const skipHierarchyCheck =
          await RoleAssignmentService.shouldSkipHierarchyCheck(fullCurrentUser);

        // 🛡️ HIERARCHY CHECK: Current user must have higher order (skip if global permission)
        await RoleValidationService.ensureUserHasHigherOrderThanRole(
          fullCurrentUser,
          {
            order: role.order,
            organizationType: role.organizationType,
            organizationId: role.organizationId,
          },
          { skipHierarchyCheck },
        );

        // 🛡️ PERMISSION GUARDRAIL: Current user must have all permissions in the role
        await RoleValidationService.validateUserCanGrantPermissions(
          fullCurrentUser,
          role.permissions as PermissionKey[],
        );
      }

      resolvedRoles.push(role);
    }

    return resolvedRoles;
  }

  /**
   * Update user roles (global or organization-specific) with full validation
   *
   * This method handles:
   * - GLOBAL roles: Permission + hierarchy + guardrails + database update
   * - ORGANIZATION roles: All above + membership check + adapter hooks
   *
   * ✅ Cache Invalidation: Automatically handled (transaction-aware)
   * - If tx NOT provided: Uses internal transaction + invalidation
   * - If tx IS provided: Uses provided transaction + invalidation (atomically)
   *
   * @param id User ID
   * @param payload Array of role slugs to set
   * @param currentUser User performing the action (for validation)
   * @param tx Optional transaction client
   * @param scope Optional scope filter (undefined/null = global roles, set = organization-specific roles)
   * @param skipValidation Skip permission/hierarchy/guardrail checks (for seeding only)
   * @returns Updated user
   */
  static async update(
    id: string,
    payload: UserRoleUpdatePayload['roleUuids'],
    currentUser: CurrentUserForValidation,
    tx?: Prisma.TransactionClient,
    scope?: {
      organizationType: OrganizationType;
      organizationId: number;
    } | null,
    skipValidation = false,
  ): Promise<User> {
    const client = tx || prisma;

    const user = await client.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // 🛡️ ORGANIZATION MEMBERSHIP CHECK: For organization-scoped roles, user must be a member
    if (scope !== undefined && scope !== null) {
      const adapter = organizationRegistry.get(scope.organizationType);
      if (adapter) {
        const isMember = await adapter.isMember(id, scope.organizationId, client);
        if (!isMember) {
          throw new BadRequestException(
            `Kullanıcı bu ${scope.organizationType} organizasyonuna üye değil. Önce üye olarak ekleyin.`,
          );
        }
      }
    }

    // 🛡️ SECURITY: Cannot modify own roles (except during user creation or seeding)
    // During user creation, user.userRoles will be empty
    if (!skipValidation && currentUser.id === id && user.userRoles.length > 0) {
      throw new ForbiddenException('Kendi rollerinizi güncelleyemezsiniz');
    }

    // Determine scope: global (null) or organization-specific
    const isGlobalScope = scope === undefined || scope === null;
    const roleFilter: Prisma.RoleWhereInput = isGlobalScope
      ? {
          // Global roles
          organizationType: null,
          organizationId: null,
        }
      : {
          // Organization-specific roles
          organizationType: scope.organizationType,
          organizationId: scope.organizationId,
        };

    // 🎯 For organization-specific roles: Get existing roles and trigger hooks
    let existingRolesToRemove: Array<{ id: number; uuid: string; type: string }> = [];
    if (!isGlobalScope) {
      const existingRoles = await client.userRole.findMany({
        where: {
          userId: user.id,
          role: roleFilter,
        },
        include: {
          role: {
            select: {
              id: true,
              uuid: true,
              type: true,
            },
          },
        },
      });

      existingRolesToRemove = existingRoles.map((ur) => ur.role);

      // Trigger beforeRemoveRole for each existing role
      const adapter = organizationRegistry.get(scope.organizationType);
      if (adapter && adapter.beforeRemoveRole) {
        for (const ur of existingRoles) {
          await adapter.beforeRemoveRole(
            user.id,
            ur.role.id,
            scope.organizationId,
            currentUser,
            client,
          );
        }
      }
    }

    // Delete existing roles in scope
    await client.userRole.deleteMany({
      where: {
        userId: user.id,
        role: roleFilter,
      },
    });

    // 🎯 For organization-specific roles: Trigger afterRemoveRole hooks
    if (!isGlobalScope && existingRolesToRemove.length > 0) {
      const adapter = organizationRegistry.get(scope.organizationType);
      if (adapter && adapter.afterRemoveRole) {
        for (const role of existingRolesToRemove) {
          await adapter.afterRemoveRole(
            user.id,
            role.id,
            scope.organizationId,
            currentUser,
            client,
          );
        }
      }
    }

    // Determine roles to assign
    // For global scope: default to 'user' if empty
    // For organization scope: can be empty (no default role required)
    const roleUuidsToAssign = payload.length > 0 ? payload : [];

    // If no roles to assign, validate removal permissions and return
    if (roleUuidsToAssign.length === 0) {
      // 🛡️ VALIDATE ROLE REMOVAL: Even when removing all roles, check permissions
      if (!skipValidation && existingRolesToRemove.length > 0) {
        // Fetch full current user data once for all validations
        const fullCurrentUser = await client.user.findUnique({
          where: { id: currentUser.id },
        });

        if (!fullCurrentUser) {
          throw new NotFoundException('Current user not found');
        }

        // Batch fetch all role details at once
        const roleIds = existingRolesToRemove.map((r) => r.id);
        const fullRoles = await client.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, order: true, permissions: true },
        });

        // Create a map for quick lookup
        const roleMap = new Map(fullRoles.map((r) => [r.id, r]));

        for (const existingRole of existingRolesToRemove) {
          const fullRole = roleMap.get(existingRole.id);

          if (fullRole) {
            const roleData = {
              id: existingRole.id,
              order: fullRole.order,
              permissions: fullRole.permissions,
              organizationType: isGlobalScope ? null : scope.organizationType,
              organizationId: isGlobalScope ? null : scope.organizationId,
            };

            // Check permission to remove
            await RoleAssignmentService.ensureUserCanManageRoleAssignment(
              roleData,
              user.id,
              fullCurrentUser,
            );

            // 🔍 Check if hierarchy should be skipped for global permissions
            const skipHierarchyCheck =
              await RoleAssignmentService.shouldSkipHierarchyCheck(fullCurrentUser);

            // Check hierarchy (skip if global permission)
            await RoleValidationService.ensureUserHasHigherOrderThanRole(
              fullCurrentUser,
              {
                order: fullRole.order,
                organizationType: roleData.organizationType,
                organizationId: roleData.organizationId,
              },
              { skipHierarchyCheck },
            );
          }
        }
      }
      return await client.user.findUniqueOrThrow({ where: { id } });
    }

    // 🛡️ VALIDATE & RESOLVE NEW ROLES with full permission checks
    const validatedRoles = await this.validateAndResolveRoles(
      roleUuidsToAssign,
      currentUser,
      scope || null,
      client,
      skipValidation,
    );

    // 🛡️ VALIDATE ROLE REMOVAL: Check if current user can remove existing roles
    if (!skipValidation && existingRolesToRemove.length > 0) {
      const rolesToRemove = existingRolesToRemove.filter(
        (existingRole) => !validatedRoles.some((newRole) => newRole.id === existingRole.id),
      );

      if (rolesToRemove.length > 0) {
        // Fetch full current user data once for all validations
        const fullCurrentUser = await client.user.findUnique({
          where: { id: currentUser.id },
        });

        if (!fullCurrentUser) {
          throw new NotFoundException('Current user not found');
        }

        // Batch fetch all role details at once
        const roleIds = rolesToRemove.map((r) => r.id);
        const fullRoles = await client.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, order: true, permissions: true },
        });

        // Create a map for quick lookup
        const roleMap = new Map(fullRoles.map((r) => [r.id, r]));

        for (const roleToRemove of rolesToRemove) {
          const fullRole = roleMap.get(roleToRemove.id);

          if (fullRole) {
            const roleData = {
              id: roleToRemove.id,
              order: fullRole.order,
              permissions: fullRole.permissions,
              organizationType: isGlobalScope ? null : scope.organizationType,
              organizationId: isGlobalScope ? null : scope.organizationId,
            };

            // Check permission to remove
            await RoleAssignmentService.ensureUserCanManageRoleAssignment(
              roleData,
              user.id,
              fullCurrentUser,
            );

            // 🔍 Check if hierarchy should be skipped for global permissions
            const skipHierarchyCheck =
              await RoleAssignmentService.shouldSkipHierarchyCheck(fullCurrentUser);

            // Check hierarchy (skip if global permission)
            await RoleValidationService.ensureUserHasHigherOrderThanRole(
              fullCurrentUser,
              {
                order: fullRole.order,
                organizationType: roleData.organizationType,
                organizationId: roleData.organizationId,
              },
              { skipHierarchyCheck },
            );
          }
        }
      }
    }

    // 🎯 For organization-specific roles: Trigger beforeAddRole hooks
    if (!isGlobalScope) {
      const adapter = organizationRegistry.get(scope.organizationType);
      if (adapter && adapter.beforeAddRole) {
        for (const role of validatedRoles) {
          await adapter.beforeAddRole(user.id, role.id, scope.organizationId, currentUser, client);
        }
      }
    }

    // Assign new roles
    await client.userRole.createMany({
      data: validatedRoles.map((role) => ({
        userId: user.id,
        roleId: role.id,
      })),
    });

    // 🎯 For organization-specific roles: Trigger afterAddRole hooks
    if (!isGlobalScope) {
      const adapter = organizationRegistry.get(scope.organizationType);
      if (adapter && adapter.afterAddRole) {
        for (const role of validatedRoles) {
          await adapter.afterAddRole(user.id, role.id, scope.organizationId, currentUser, client);
        }
      }
    }

    // Invalidate claims and roles (transaction-aware)
    await invalidateUserClaimsAndRoles(id, client);

    return await client.user.findUniqueOrThrow({ where: { id } });
  }
}
