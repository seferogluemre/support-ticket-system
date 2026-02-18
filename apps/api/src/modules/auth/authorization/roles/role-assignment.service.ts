import { isValidUuid } from '#utils';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#utils/http-errors';
import prisma from '@onlyjs/db';
import type { User } from '@onlyjs/db/client';
import { Prisma } from '@onlyjs/db/client';
import { AUTH_BYPASS_ENABLED } from '../../../../config/auth.config';
import { generateUserClaims, invalidateUserClaimsAndRoles, matchesWildcard } from '../claims';
import { organizationRegistry } from '../organizations';
import type { OrganizationType } from '@onlyjs/db/enums';
import type { BaseOrganizationAdapter } from '../organizations/base-adapter';
import { PERMISSIONS } from '../permissions/constants';
import type { PermissionKey } from '../permissions/types';
import { UserMembershipsService } from '../user-memberships';
import { RoleValidationService } from './role-validation.service';

/**
 * 🎯 RoleAssignmentService
 *
 * Centralized service for ALL role assignment operations:
 * - Add/remove roles to/from users
 * - Batch operations (multiple roles at once)
 * - Organization member management permissions
 * - Adapter hooks execution (beforeAddRole, afterAddRole, etc.)
 *
 * ✅ Used by: UserRolesService, OrganizationsService
 * ✅ Supports: Both global and organization-scoped roles
 * ✅ Handles: Permission checks, hierarchy checks, membership validation, hooks
 */
export abstract class RoleAssignmentService {
  // ============================================================================
  // 🔍 ROLE LOOKUP
  // ============================================================================

  /**
   * Get role info by UUID ONLY
   * 🔒 SECURITY: Only accepts UUID to prevent slug collision attacks
   * @param roleUuid Role UUID
   * @returns Role information
   */
  static async getRoleInfo(roleUuid: string) {
    if (!isValidUuid(roleUuid)) {
      throw new BadRequestException('Invalid role UUID format.');
    }

    const role = await prisma.role.findUnique({
      where: { uuid: roleUuid },
      select: {
        id: true,
        uuid: true,
        name: true,
        order: true,
        permissions: true,
        organizationType: true,
        organizationId: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    return role;
  }

  // ============================================================================
  // 🔐 HELPER METHODS
  // ============================================================================

  /**
   * Check if user should bypass hierarchy checks
   * Returns true if user has global wildcard or ALL_ORGANIZATIONS manage permission
   */
  static async shouldSkipHierarchyCheck(currentUser: User): Promise<boolean> {
    const claims = await generateUserClaims(currentUser.id);
    const hasGlobalWildcard = claims.global.includes('*');
    const hasGlobalManagePermission = claims.global.some((perm) =>
      matchesWildcard(PERMISSIONS.USER_ROLES.ASSIGN_ROLE_ALL_ORGANIZATIONS.key, perm),
    );

    return hasGlobalWildcard || hasGlobalManagePermission;
  }

  // ============================================================================
  // 🔐 ROLE ASSIGNMENT PERMISSIONS
  // ============================================================================

  /**
   * Ensure user can ASSIGN/REMOVE roles to/from another user
   *
   * Flow:
   * 1. Wildcard (*) → Bypass all checks
   * 2. Global role: Requires ASSIGN_GLOBAL_ROLE
   * 3. Organization role (same org): Requires ASSIGN_ROLE_OWN_ORGANIZATION
   * 4. Organization role (diff org): Requires ASSIGN_ROLE_ALL_ORGANIZATIONS
   */
  static async ensureUserCanManageRoleAssignment(
    role: { organizationType: OrganizationType | null; organizationId: number | null },
    targetUserId: string,
    currentUser: User,
  ): Promise<void> {
    // TODO: TEMPORARY - Remove this bypass when proper permissions are set up
    if (AUTH_BYPASS_ENABLED) {
      return;
    }

    const claims = await generateUserClaims(currentUser.id);

    // Wildcard bypass
    if (claims.global.includes('*')) {
      return;
    }

    // Global role
    if (!role.organizationType || !role.organizationId) {
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_ROLES.ASSIGN_GLOBAL_ROLE.key, perm),
        )
      ) {
        throw new ForbiddenException('Global rol atama/kaldırma yetkiniz yok');
      }
      return;
    }

    // Organization role
    const adapter = organizationRegistry.get(role.organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu tipte organization rolü atama/kaldırma yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(role.organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu tipte organization rolü atama/kaldırma yetkiniz yok');
    }

    // Check if target user is member of this organization
    const targetUserClaims = await generateUserClaims(targetUserId);
    const targetUserOrgPermissions =
      targetUserClaims.organizations[role.organizationType]?.[orgUuid];
    const isTargetUserMember = targetUserOrgPermissions && targetUserOrgPermissions.length > 0;

    // Check if current user is member of this organization
    const currentUserOrgPermissions = claims.organizations[role.organizationType]?.[orgUuid];
    const isCurrentUserMember = currentUserOrgPermissions && currentUserOrgPermissions.length > 0;

    if (isTargetUserMember && isCurrentUserMember) {
      // Both users in same organization
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_ROLES.ASSIGN_ROLE_OWN_ORGANIZATION.key, perm),
        )
      ) {
        throw new ForbiddenException(
          'Kendi organizasyonunuzdaki kullanıcılara rol atama/kaldırma yetkiniz yok',
        );
      }
    } else {
      // Target user in different organization
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_ROLES.ASSIGN_ROLE_ALL_ORGANIZATIONS.key, perm),
        )
      ) {
        throw new ForbiddenException(
          'Bu organizasyondaki kullanıcılara rol atama/kaldırma yetkiniz yok',
        );
      }
    }
  }

  /**
   * Ensure user can ADD members to organization
   */
  static async ensureUserCanAddMembers(
    organizationType: OrganizationType,
    organizationId: number,
    currentUser: User,
  ): Promise<void> {
    // TODO: TEMPORARY - Remove this bypass when proper permissions are set up
    if (AUTH_BYPASS_ENABLED) {
      return;
    }

    const claims = await generateUserClaims(currentUser.id);

    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu tipte organization üye ekleme yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu tipte organization üye ekleme yetkiniz yok');
    }

    // Check if current user is member of this organization
    const currentUserOrgPermissions = claims.organizations[organizationType]?.[orgUuid];
    const isCurrentUserMember = currentUserOrgPermissions && currentUserOrgPermissions.length > 0;

    if (isCurrentUserMember) {
      // Member of same organization
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_MEMBERS.ADD_MEMBERS_OWN_ORGANIZATION.key, perm),
        )
      ) {
        throw new ForbiddenException('Kendi organizasyonunuzdaki üyeleri ekleme yetkiniz yok');
      }
    } else {
      // Not a member
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_MEMBERS.ADD_MEMBERS_ALL_ORGANIZATIONS.key, perm),
        )
      ) {
        throw new ForbiddenException('Bu organizasyondaki üyeleri ekleme yetkiniz yok');
      }
    }
  }

  /**
   * Ensure user can REMOVE members from organization
   */
  static async ensureUserCanRemoveMembers(
    organizationType: OrganizationType,
    organizationId: number,
    currentUser: User,
  ): Promise<void> {
    // TODO: TEMPORARY - Remove this bypass when proper permissions are set up
    if (AUTH_BYPASS_ENABLED) {
      return;
    }

    const claims = await generateUserClaims(currentUser.id);

    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu tipte organization üye çıkarma yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu tipte organization üye çıkarma yetkiniz yok');
    }

    // Check if current user is member of this organization
    const currentUserOrgPermissions = claims.organizations[organizationType]?.[orgUuid];
    const isCurrentUserMember = currentUserOrgPermissions && currentUserOrgPermissions.length > 0;

    if (isCurrentUserMember) {
      // Member of same organization
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_MEMBERS.REMOVE_MEMBERS_OWN_ORGANIZATION.key, perm),
        )
      ) {
        throw new ForbiddenException('Kendi organizasyonunuzdaki üyeleri çıkarma yetkiniz yok');
      }
    } else {
      // Not a member
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_MEMBERS.REMOVE_MEMBERS_ALL_ORGANIZATIONS.key, perm),
        )
      ) {
        throw new ForbiddenException('Bu organizasyondaki üyeleri çıkarma yetkiniz yok');
      }
    }
  }

  // ============================================================================
  // 🪝 ADAPTER HOOKS
  // ============================================================================

  /**
   * Execute adapter-specific hooks (beforeAddRole, afterAddRole, etc.)
   */
  private static async executeHooks(
    role: { organizationType: OrganizationType | null; organizationId: number | null; id: number },
    userId: string,
    currentUser: User,
    hookType: 'add' | 'remove',
    hookTiming: 'before' | 'after',
    adapter?: BaseOrganizationAdapter,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (role.organizationType && role.organizationId) {
      const targetAdapter = adapter || organizationRegistry.get(role.organizationType);
      if (targetAdapter) {
        if (hookTiming === 'before') {
          if (hookType === 'add' && targetAdapter.beforeAddRole) {
            await targetAdapter.beforeAddRole(
              userId,
              role.id,
              role.organizationId,
              currentUser,
              tx,
            );
          } else if (hookType === 'remove' && targetAdapter.beforeRemoveRole) {
            await targetAdapter.beforeRemoveRole(
              userId,
              role.id,
              role.organizationId,
              currentUser,
              tx,
            );
          }
        } else if (hookTiming === 'after') {
          if (hookType === 'add' && targetAdapter.afterAddRole) {
            await targetAdapter.afterAddRole(userId, role.id, role.organizationId, currentUser, tx);
          } else if (hookType === 'remove' && targetAdapter.afterRemoveRole) {
            await targetAdapter.afterRemoveRole(
              userId,
              role.id,
              role.organizationId,
              currentUser,
              tx,
            );
          }
        }
      }
    }
  }

  // ============================================================================
  // 🎯 SINGLE ROLE ASSIGNMENT
  // ============================================================================

  /**
   * Add a single role to a user
   *
   * ✅ Validates: Permission, Hierarchy, Guardrails, Membership
   * ✅ Executes: Adapter hooks
   * ✅ Handles: Cache invalidation (transaction-aware)
   * ✅ Supports: Both global and organization-scoped roles
   * 🔒 SECURITY: Only accepts UUID
   */
  static async addRoleToUser(
    roleUuid: string,
    userId: string,
    currentUser: User,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const role = await this.getRoleInfo(roleUuid);

    // Permission check
    await this.ensureUserCanManageRoleAssignment(role, userId, currentUser);

    // Determine if hierarchy check should be skipped
    const skipHierarchyCheck = await this.shouldSkipHierarchyCheck(currentUser);

    // Hierarchy check (skipped if user has global manage permission)
    await RoleValidationService.ensureUserHasHigherOrderThanRole(
      currentUser,
      {
        order: role.order,
        organizationType: role.organizationType,
        organizationId: role.organizationId,
      },
      { skipHierarchyCheck },
    );

    // Guardrail check
    await RoleValidationService.validateUserCanGrantPermissions(
      currentUser,
      role.permissions as PermissionKey[],
    );

    // Membership check (organization-specific roles only)
    if (role.organizationType && role.organizationId) {
      const adapter = organizationRegistry.get(role.organizationType);
      if (adapter) {
        const isTargetUserMember = await adapter.isMember(userId, role.organizationId, tx);
        if (!isTargetUserMember) {
          throw new ConflictException(
            `Kullanıcı bu ${role.organizationType} organizasyonuna üye değil`,
          );
        }
      }
    }

    const client = tx || prisma;

    // Check if already assigned
    const existingUserRole = await client.userRole.findFirst({
      where: {
        userId: userId,
        roleId: role.id,
      },
    });

    if (existingUserRole) {
      throw new ConflictException('Kullanıcı bu role zaten atanmış');
    }

    // Before hook
    await this.executeHooks(role, userId, currentUser, 'add', 'before', undefined, tx);

    // Create UserRole (with organizationType and organizationId for proper querying)
    await client.userRole.create({
      data: {
        userId: userId,
        roleId: role.id,
        organizationType: role.organizationType || null,
        organizationId: role.organizationId || null,
      },
    });

    // After hook
    await this.executeHooks(role, userId, currentUser, 'add', 'after', undefined, tx);

    // Invalidate claims and roles (transaction-aware)
    await invalidateUserClaimsAndRoles(userId, tx);
  }

  /**
   * Remove a single role from a user
   *
   * ✅ Validates: Permission, Hierarchy, Guardrails
   * ✅ Executes: Adapter hooks
   * ✅ Handles: Cache invalidation (transaction-aware)
   * ✅ Supports: Both global and organization-scoped roles
   * 🔒 SECURITY: Only accepts UUID
   */
  static async removeRoleFromUser(
    roleUuid: string,
    userId: string,
    currentUser: User,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const role = await this.getRoleInfo(roleUuid);

    // Permission check
    await this.ensureUserCanManageRoleAssignment(role, userId, currentUser);

    // Determine if hierarchy check should be skipped
    const skipHierarchyCheck = await this.shouldSkipHierarchyCheck(currentUser);

    // Hierarchy check (skipped if user has global manage permission)
    await RoleValidationService.ensureUserHasHigherOrderThanRole(
      currentUser,
      {
        order: role.order,
        organizationType: role.organizationType,
        organizationId: role.organizationId,
      },
      { skipHierarchyCheck },
    );

    // Guardrail check
    await RoleValidationService.validateUserCanGrantPermissions(
      currentUser,
      role.permissions as PermissionKey[],
    );

    const client = tx || prisma;

    // Find UserRole
    const userRole = await client.userRole.findFirst({
      where: {
        userId: userId,
        roleId: role.id,
      },
    });

    if (!userRole) {
      throw new NotFoundException('Kullanıcının bu rolü yok');
    }

    // Before hook
    await this.executeHooks(role, userId, currentUser, 'remove', 'before', undefined, tx);

    // Delete UserRole
    await client.userRole.delete({
      where: { id: userRole.id },
    });

    // After hook
    await this.executeHooks(role, userId, currentUser, 'remove', 'after', undefined, tx);

    // Invalidate claims and roles (transaction-aware)
    await invalidateUserClaimsAndRoles(userId, tx);
  }

  // ============================================================================
  // 🎯 BATCH ROLE ASSIGNMENT
  // ============================================================================

  /**
   * Add multiple roles to a user
   *
   * ✅ Validates: Permission, Hierarchy, Guardrails, Membership for each role
   * ✅ Executes: Batch adapter hooks (beforeAddRoles, afterAddRoles)
   * ✅ Handles: Cache invalidation (transaction-aware)
   * ✅ Supports: Both global and organization-scoped roles
   * 🔒 SECURITY: Only accepts UUIDs
   */
  static async addRolesToUser(
    roleUuids: string[],
    userId: string,
    currentUser: User,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Fetch all roles
    const roles = await Promise.all(roleUuids.map((roleUuid) => this.getRoleInfo(roleUuid)));

    // Group by organization
    const rolesByOrg: Record<string, { roles: typeof roles; organizationId: number }> = {};
    const globalRoles: typeof roles = [];

    for (const role of roles) {
      if (!role.organizationType || !role.organizationId) {
        globalRoles.push(role);
      } else {
        const key = `${role.organizationType}:${role.organizationId}`;
        if (!rolesByOrg[key]) {
          rolesByOrg[key] = { roles: [], organizationId: role.organizationId };
        }
        rolesByOrg[key].roles.push(role);
      }
    }

    // Determine if hierarchy check should be skipped for this user
    const skipHierarchyCheck = await this.shouldSkipHierarchyCheck(currentUser);

    // Validate all roles
    for (const role of roles) {
      await this.ensureUserCanManageRoleAssignment(role, userId, currentUser);

      await RoleValidationService.ensureUserHasHigherOrderThanRole(
        currentUser,
        {
          order: role.order,
          organizationType: role.organizationType,
          organizationId: role.organizationId,
        },
        { skipHierarchyCheck },
      );

      await RoleValidationService.validateUserCanGrantPermissions(
        currentUser,
        role.permissions as PermissionKey[],
      );

      // Membership check (organization-specific roles only)
      if (role.organizationType && role.organizationId) {
        const adapter = organizationRegistry.get(role.organizationType);
        if (adapter) {
          const isTargetUserMember = await adapter.isMember(userId, role.organizationId, tx);
          if (!isTargetUserMember) {
            throw new ConflictException(
              `Kullanıcı bu ${role.organizationType} organizasyonuna üye değil`,
            );
          }
        }
      }
    }

    // Execute BEFORE hooks (grouped by organization)
    for (const [orgKey, orgData] of Object.entries(rolesByOrg)) {
      const [orgType] = orgKey.split(':');
      if (orgType) {
        const adapter = organizationRegistry.get(orgType);
        if (adapter && adapter.beforeAddRoles) {
          const roleIds = orgData.roles.map((r) => r.id);
          await adapter.beforeAddRoles(userId, roleIds, orgData.organizationId, currentUser, tx);
        } else {
          // Fallback: Single hooks
          for (const role of orgData.roles) {
            await this.executeHooks(
              role,
              userId,
              currentUser,
              'add',
              'before',
              adapter || undefined,
              tx,
            );
          }
        }
      }
    }

    // Execute BEFORE hooks for global roles
    for (const role of globalRoles) {
      await this.executeHooks(role, userId, currentUser, 'add', 'before', undefined, tx);
    }

    const client = tx || prisma;

    // Check existing roles
    const existingUserRoles = await client.userRole.findMany({
      where: {
        userId: userId,
        roleId: { in: roles.map((r) => r.id) },
      },
      select: { roleId: true },
    });

    const existingRoleIds = new Set(existingUserRoles.map((ur) => ur.roleId));
    const newRoles = roles.filter((role) => !existingRoleIds.has(role.id));

    if (newRoles.length === 0) {
      throw new ConflictException('Kullanıcı bu rollerin hepsine zaten atanmış');
    }

    // Create UserRoles (with organizationType and organizationId for proper querying)
    await client.userRole.createMany({
      data: newRoles.map((role) => ({
        userId: userId,
        roleId: role.id,
        organizationType: role.organizationType || null,
        organizationId: role.organizationId || null,
      })),
    });

    // Execute AFTER hooks (grouped by organization)
    for (const [orgKey, orgData] of Object.entries(rolesByOrg)) {
      const [orgType] = orgKey.split(':');
      if (orgType) {
        const adapter = organizationRegistry.get(orgType);
        if (adapter && adapter.afterAddRoles) {
          const roleIds = orgData.roles.map((r) => r.id);
          await adapter.afterAddRoles(userId, roleIds, orgData.organizationId, currentUser, tx);
        } else {
          // Fallback: Single hooks
          for (const role of orgData.roles) {
            await this.executeHooks(
              role,
              userId,
              currentUser,
              'add',
              'after',
              adapter || undefined,
              tx,
            );
          }
        }
      }
    }

    // Execute AFTER hooks for global roles
    for (const role of globalRoles) {
      await this.executeHooks(role, userId, currentUser, 'add', 'after', undefined, tx);
    }

    // Invalidate claims, roles, and memberships (transaction-aware)
    await invalidateUserClaimsAndRoles(userId, tx);

    // Invalidate memberships if any organization roles were added (isAdmin flag may have changed)
    if (Object.keys(rolesByOrg).length > 0) {
      // Only invalidate after transaction completes
      if (!tx) {
        await UserMembershipsService.invalidateUserMemberships(userId);
      }
    }
  }

  /**
   * Remove multiple roles from a user
   *
   * ✅ Validates: Permission, Hierarchy, Guardrails for each role
   * ✅ Executes: Batch adapter hooks (beforeRemoveRoles, afterRemoveRoles)
   * ✅ Handles: Cache invalidation (transaction-aware)
   * ✅ Supports: Both global and organization-scoped roles
   * 🔒 SECURITY: Only accepts UUIDs
   */
  static async removeRolesFromUser(
    roleUuids: string[],
    userId: string,
    currentUser: User,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Fetch all roles
    const roles = await Promise.all(roleUuids.map((roleUuid) => this.getRoleInfo(roleUuid)));

    // Group by organization
    const rolesByOrg: Record<string, { roles: typeof roles; organizationId: number }> = {};
    const globalRoles: typeof roles = [];

    for (const role of roles) {
      if (!role.organizationType || !role.organizationId) {
        globalRoles.push(role);
      } else {
        const key = `${role.organizationType}:${role.organizationId}`;
        if (!rolesByOrg[key]) {
          rolesByOrg[key] = { roles: [], organizationId: role.organizationId };
        }
        rolesByOrg[key].roles.push(role);
      }
    }

    // Determine if hierarchy check should be skipped for this user
    const skipHierarchyCheck = await this.shouldSkipHierarchyCheck(currentUser);

    // Validate all roles
    for (const role of roles) {
      await this.ensureUserCanManageRoleAssignment(role, userId, currentUser);

      await RoleValidationService.ensureUserHasHigherOrderThanRole(
        currentUser,
        {
          order: role.order,
          organizationType: role.organizationType,
          organizationId: role.organizationId,
        },
        { skipHierarchyCheck },
      );

      await RoleValidationService.validateUserCanGrantPermissions(
        currentUser,
        role.permissions as PermissionKey[],
      );
    }

    // Execute BEFORE hooks (grouped by organization)
    for (const [orgKey, orgData] of Object.entries(rolesByOrg)) {
      const [orgType] = orgKey.split(':');
      if (orgType) {
        const adapter = organizationRegistry.get(orgType);
        if (adapter && adapter.beforeRemoveRoles) {
          const roleIds = orgData.roles.map((r) => r.id);
          await adapter.beforeRemoveRoles(userId, roleIds, orgData.organizationId, currentUser, tx);
        } else {
          // Fallback: Single hooks
          for (const role of orgData.roles) {
            await this.executeHooks(
              role,
              userId,
              currentUser,
              'remove',
              'before',
              adapter || undefined,
              tx,
            );
          }
        }
      }
    }

    // Execute BEFORE hooks for global roles
    for (const role of globalRoles) {
      await this.executeHooks(role, userId, currentUser, 'remove', 'before', undefined, tx);
    }

    const client = tx || prisma;

    // Find existing UserRoles
    const existingUserRoles = await client.userRole.findMany({
      where: {
        userId: userId,
        roleId: { in: roles.map((r) => r.id) },
      },
      select: { id: true, roleId: true },
    });

    if (existingUserRoles.length === 0) {
      throw new NotFoundException('Kullanıcının bu rollerin hiçbiri yok');
    }

    // Delete UserRoles
    await client.userRole.deleteMany({
      where: {
        id: { in: existingUserRoles.map((ur) => ur.id) },
      },
    });

    // Execute AFTER hooks (grouped by organization)
    for (const [orgKey, orgData] of Object.entries(rolesByOrg)) {
      const [orgType] = orgKey.split(':');
      if (orgType) {
        const adapter = organizationRegistry.get(orgType);
        if (adapter && adapter.afterRemoveRoles) {
          const roleIds = orgData.roles.map((r) => r.id);
          await adapter.afterRemoveRoles(userId, roleIds, orgData.organizationId, currentUser, tx);
        } else {
          // Fallback: Single hooks
          for (const role of orgData.roles) {
            await this.executeHooks(
              role,
              userId,
              currentUser,
              'remove',
              'after',
              adapter || undefined,
              tx,
            );
          }
        }
      }
    }

    // Execute AFTER hooks for global roles
    for (const role of globalRoles) {
      await this.executeHooks(role, userId, currentUser, 'remove', 'after', undefined, tx);
    }

    // Invalidate claims, roles, and memberships (transaction-aware)
    await invalidateUserClaimsAndRoles(userId, tx);

    // Invalidate memberships if any organization roles were removed (isAdmin flag may have changed)
    if (Object.keys(rolesByOrg).length > 0) {
      // Only invalidate after transaction completes
      if (!tx) {
        await UserMembershipsService.invalidateUserMemberships(userId);
      }
    }
  }

  // ============================================================================
  // 🔄 BULK MEMBER SYNC
  // ============================================================================

  /**
   * Sync role members - compare current members with desired state
   * Adds missing users and removes extras
   *
   * @param roleUuid Role UUID
   * @param userIds Desired list of user UUIDs
   * @param currentUser User performing the action
   * @returns Summary of changes (added, removed)
   */
  static async syncRoleMembers(
    roleUuid: string,
    userIds: string[],
    currentUser: User,
  ): Promise<{ added: number; removed: number }> {
    const roleInfo = await this.getRoleInfo(roleUuid);

    // Get current members
    const currentMembers = await prisma.userRole.findMany({
      where: { roleId: roleInfo.id },
      select: { userId: true },
    });

    const currentUserIds = new Set(currentMembers.map((m) => m.userId));
    const desiredUserIds = new Set(userIds);

    // Calculate diff
    const toAdd = userIds.filter((id) => !currentUserIds.has(id));
    const toRemove = currentMembers.map((m) => m.userId).filter((id) => !desiredUserIds.has(id));

    // Execute changes
    let added = 0;
    let removed = 0;

    // Add new members
    for (const userId of toAdd) {
      try {
        await this.addRoleToUser(roleUuid, userId, currentUser);
        added++;
      } catch (error) {
        console.error(`Failed to add user ${userId} to role ${roleUuid}:`, error);
        // Continue with other users
      }
    }

    // Remove old members
    for (const userId of toRemove) {
      try {
        await this.removeRoleFromUser(roleUuid, userId, currentUser);
        removed++;
      } catch (error) {
        console.error(`Failed to remove user ${userId} from role ${roleUuid}:`, error);
        // Continue with other users
      }
    }

    return { added, removed };
  }
}
