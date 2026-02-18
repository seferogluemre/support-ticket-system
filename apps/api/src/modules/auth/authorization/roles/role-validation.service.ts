import prisma from '@onlyjs/db';
import type { OrganizationType } from '@onlyjs/db/enums';
import type { Role, User } from '@onlyjs/db/client';
import { AUTH_BYPASS_ENABLED } from '../../../../config/auth.config';
import { ForbiddenException } from '../../../../utils';
import { generateUserClaims, matchesWildcard } from '../claims';
import { organizationRegistry } from '../organizations';
import { PERMISSIONS } from '../permissions/constants';
import type { PermissionKey } from '../permissions/types';

/**
 * 🛡️ RoleValidationService
 *
 * Centralized service for ALL role-related validation logic:
 * - Permission checks (can user perform action?)
 * - Hierarchy checks
 * - Permission guardrails (can user grant these permissions?)
 * - Row-level security (can user access this resource?)
 *
 * ✅ Used by: RolesService, RoleAssignmentService, UserRolesService
 * ✅ Supports: Both global and organization-scoped roles
 */
export abstract class RoleValidationService {
  // ============================================================================
  // 🎯 HIERARCHY VALIDATION
  // ============================================================================

  /**
   * Get user's highest role order in a specific hierarchy
   *
   * @param userId User ID
   * @param organizationType Organization type (null = global hierarchy)
   * @param organizationId Organization ID (null = global hierarchy)
   * @returns Highest order or null if no roles
   */
  static async getUserHighestRoleOrder(
    userId: string,
    organizationType: OrganizationType | null = null,
    organizationId: number | null = null,
  ): Promise<number | null> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          organizationType,
          organizationId,
        },
      },
      include: {
        role: { select: { order: true } },
      },
      orderBy: {
        role: { order: 'desc' }, // Highest order first
      },
    });

    return userRole?.role?.order ?? null;
  }

  /**
   * 🎯 Ensure user has higher order than target role
   *
   * Rule: userHighestOrder > targetRole.order
   * User can only manage roles with LOWER order than their highest role
   *
   * 🔓 BYPASS OPTIONS:
   * 1. Global wildcard (*) - bypasses all checks
   * 2. skipHierarchyCheck = true - useful when caller already verified global permissions
   *
   * @param currentUser Current user
   * @param targetRole Target role
   * @param options Optional settings
   * @param options.skipHierarchyCheck Skip hierarchy validation (use when caller verified global permissions)
   * @throws ForbiddenException if hierarchy violated
   */
  static async ensureUserHasHigherOrderThanRole(
    currentUser: User,
    targetRole: {
      order: number;
      organizationType: OrganizationType | null;
      organizationId: number | null;
    },
    options?: {
      skipHierarchyCheck?: boolean;
    },
  ): Promise<void> {
    // TODO: TEMPORARY - Remove this bypass when proper permissions are set up
    if (AUTH_BYPASS_ENABLED) {
      return;
    }

    // Skip if explicitly requested (caller should verify permissions first)
    if (options?.skipHierarchyCheck) {
      return;
    }

    // Get user's highest role order in the same hierarchy
    const userHighestOrder = await this.getUserHighestRoleOrder(
      currentUser.id,
      targetRole.organizationType,
      targetRole.organizationId,
    );

    // If user has no roles in this hierarchy, they cannot manage any role
    if (userHighestOrder === null) {
      throw new ForbiddenException(
        'Bu hiyerarşide role yönetmek için gerekli yetkiye sahip değilsiniz',
      );
    }

    // User can only manage roles with LOWER order than their highest role
    if (targetRole.order >= userHighestOrder) {
      throw new ForbiddenException(
        `Bu role yönetmek için yeterli yetkiniz yok (gerekli order: >${targetRole.order}, sizin en yüksek: ${userHighestOrder})`,
      );
    }
  }

  // ============================================================================
  // 🛡️ PERMISSION GUARDRAILS
  // ============================================================================

  /**
   * Validate user can grant all specified permissions
   *
   * Rule: User can only grant permissions they already have (with wildcard support)
   *
   * @param currentUser Current user
   * @param permissions Permissions to validate
   * @throws ForbiddenException if user doesn't have required permissions
   */
  static async validateUserCanGrantPermissions(
    currentUser: User,
    permissions: PermissionKey[],
  ): Promise<void> {
    // TODO: TEMPORARY - Remove this bypass when proper permissions are set up
    if (AUTH_BYPASS_ENABLED) {
      return;
    }

    // Current user'ın claims'ini al (wildcard'lar expand edilmemiş halde)
    const claims = await generateUserClaims(currentUser.id);

    // Wildcard bypass
    if (claims.global.includes('*')) {
      return;
    }

    // Role'deki her permission'ı kontrol et (wildcard matching ile)
    const missingPermissions = permissions.filter((perm) => {
      // User'ın bu permission'ı var mı? (wildcard matching ile)
      return !claims.global.some((userPerm) => matchesWildcard(perm, userPerm));
    });

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Sahip olmadığınız yetkileri veremezsiniz: ${missingPermissions.join(', ')}`,
      );
    }
  }

  // ============================================================================
  // 🔐 ROLE CREATION PERMISSIONS
  // ============================================================================

  /**
   * Ensure user has permission to CREATE a role in this scope
   *
   * Flow:
   * 1. Wildcard (*) → Bypass all checks
   * 2. Global role: Requires CREATE_GLOBALS
   * 3. Organization role (member): Requires CREATE_OWN_ORGANIZATION
   * 4. Organization role (non-member): Requires CREATE_ALL_ORGANIZATIONS
   */
  static async ensureUserCanCreateRole(
    organizationType: OrganizationType | null,
    organizationId: number | null,
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
    if (!organizationType || !organizationId) {
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.ROLE_MANAGE_GLOBAL.CREATE_GLOBALS.key, perm),
        )
      ) {
        throw new ForbiddenException('Global rol oluşturma yetkiniz yok');
      }
      return;
    }

    // Organization role
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu tipte organization rolü oluşturma yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu tipte organization rolü oluşturma yetkiniz yok');
    }

    // Check if user is member of this organization
    const orgPermissions = claims.organizations[organizationType]?.[orgUuid];
    const isOrgMember = orgPermissions && orgPermissions.length > 0;

    if (isOrgMember) {
      // Member: CREATE_OWN_ORGANIZATION
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.ROLE_MANAGE_ORGANIZATION.CREATE_OWN_ORGANIZATION.key, perm),
        )
      ) {
        throw new ForbiddenException('Kendi organizasyonunuzda rol oluşturma yetkiniz yok');
      }
    } else {
      // Non-member: CREATE_ALL_ORGANIZATIONS
      if (
        !claims.global.some((perm) =>
          matchesWildcard(
            PERMISSIONS.ROLE_MANAGE_ALL_ORGANIZATIONS.CREATE_ALL_ORGANIZATIONS.key,
            perm,
          ),
        )
      ) {
        throw new ForbiddenException(
          'Bu organizasyonda rol oluşturma yetkiniz yok (üye değilsiniz)',
        );
      }
    }
  }

  // ============================================================================
  // 🔐 ROLE MODIFICATION PERMISSIONS (UPDATE/DELETE)
  // ============================================================================

  /**
   * Ensure user has permission to UPDATE/DELETE a role
   *
   * Flow:
   * 1. Wildcard (*) → Bypass all checks
   * 2. Global role: Requires UPDATE_GLOBALS or DELETE_GLOBALS + Hierarchy check
   * 3. Organization role (member): Requires UPDATE_OWN_ORGANIZATION or DELETE_OWN_ORGANIZATION + Hierarchy check
   * 4. Organization role (non-member): Requires UPDATE_ALL_ORGANIZATIONS or DELETE_ALL_ORGANIZATIONS (no hierarchy check)
   */
  static async ensureUserCanModifyRole(
    role: {
      id: number;
      order: number;
      organizationType: OrganizationType | null;
      organizationId: number | null;
    },
    currentUser: User,
    action: 'update' | 'delete',
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
      const requiredPermission =
        action === 'update'
          ? PERMISSIONS.ROLE_MANAGE_GLOBAL.UPDATE_GLOBALS.key
          : PERMISSIONS.ROLE_MANAGE_GLOBAL.DELETE_GLOBALS.key;

      if (!claims.global.includes(requiredPermission)) {
        throw new ForbiddenException(
          `Bu global rolü ${action === 'update' ? 'güncelleme' : 'silme'} yetkiniz yok`,
        );
      }

      // Hierarchy check for global roles
      await this.ensureUserHasHigherOrderThanRole(currentUser, {
        order: role.order,
        organizationType: role.organizationType,
        organizationId: role.organizationId,
      });

      return;
    }

    // Organization role
    const adapter = organizationRegistry.get(role.organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu rolü modify etme yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(role.organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu rolü modify etme yetkiniz yok');
    }

    const orgPermissions = claims.organizations[role.organizationType]?.[orgUuid];
    const isOrgMember = orgPermissions && orgPermissions.length > 0;

    if (isOrgMember) {
      // Member: UPDATE_OWN_ORGANIZATION or DELETE_OWN_ORGANIZATION
      const requiredOwnOrgPermission =
        action === 'update'
          ? PERMISSIONS.ROLE_MANAGE_ORGANIZATION.UPDATE_OWN_ORGANIZATION.key
          : PERMISSIONS.ROLE_MANAGE_ORGANIZATION.DELETE_OWN_ORGANIZATION.key;

      if (!claims.global.includes(requiredOwnOrgPermission)) {
        throw new ForbiddenException(
          `Kendi organizasyonunuzun rollerini ${action === 'update' ? 'güncelleme' : 'silme'} yetkiniz yok`,
        );
      }

      // Hierarchy check for organization members
      await this.ensureUserHasHigherOrderThanRole(currentUser, {
        order: role.order,
        organizationType: role.organizationType,
        organizationId: role.organizationId,
      });
    } else {
      // Non-member: UPDATE_ALL_ORGANIZATIONS or DELETE_ALL_ORGANIZATIONS
      const requiredAllOrgsPermission =
        action === 'update'
          ? PERMISSIONS.ROLE_MANAGE_ALL_ORGANIZATIONS.UPDATE_ALL_ORGANIZATIONS.key
          : PERMISSIONS.ROLE_MANAGE_ALL_ORGANIZATIONS.DELETE_ALL_ORGANIZATIONS.key;

      if (!claims.global.includes(requiredAllOrgsPermission)) {
        throw new ForbiddenException(
          `Bu organizasyonun rollerini ${action === 'update' ? 'güncelleme' : 'silme'} yetkiniz yok (üye değilsiniz)`,
        );
      }

      // No hierarchy check for non-members with global permission
    }
  }

  // ============================================================================
  // 🔐 ROLE REORDER PERMISSIONS
  // ============================================================================

  /**
   * Ensure user has permission to REORDER roles in this scope
   */
  static async ensureUserCanReorderRoles(
    organizationType: OrganizationType | null,
    organizationId: number | null,
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

    // Global roles reordering
    if (!organizationType || !organizationId) {
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.ROLE_MANAGE_GLOBAL.REORDER_GLOBALS.key, perm),
        )
      ) {
        throw new ForbiddenException('Global rolleri yeniden sıralama yetkiniz yok');
      }
      return;
    }

    // Organization roles reordering
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu organizasyonun rollerini yeniden sıralama yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu organizasyonun rollerini yeniden sıralama yetkiniz yok');
    }

    const orgPermissions = claims.organizations[organizationType]?.[orgUuid];
    const isOrgMember = orgPermissions && orgPermissions.length > 0;

    if (isOrgMember) {
      // Member: REORDER_OWN_ORGANIZATION
      if (
        !claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.ROLE_MANAGE_ORGANIZATION.REORDER_OWN_ORGANIZATION.key, perm),
        )
      ) {
        throw new ForbiddenException(
          'Kendi organizasyonunuzun rollerini yeniden sıralama yetkiniz yok',
        );
      }
    } else {
      // Non-member: REORDER_ALL_ORGANIZATIONS
      if (
        !claims.global.some((perm) =>
          matchesWildcard(
            PERMISSIONS.ROLE_MANAGE_ALL_ORGANIZATIONS.REORDER_ALL_ORGANIZATIONS.key,
            perm,
          ),
        )
      ) {
        throw new ForbiddenException(
          'Bu organizasyonun rollerini yeniden sıralama yetkiniz yok (üye değilsiniz)',
        );
      }
    }
  }

  // ============================================================================
  // 🔐 ROW-LEVEL SECURITY (SHOW)
  // ============================================================================

  /**
   * Ensure user can access (view) a specific role
   *
   * Flow:
   * 1. Wildcard (*) → Can view all roles
   * 2. Global role: SHOW_GLOBALS permission OR user's own role
   * 3. Organization role: SHOW_ALL_ORGANIZATIONS permission OR organization member OR user's own role
   */
  static async ensureUserCanAccessRole(role: Role, currentUser: User): Promise<void> {
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
      // SHOW_GLOBALS permission
      if (
        claims.global.some((perm) => matchesWildcard(PERMISSIONS.ROLE_VIEW.SHOW_GLOBALS.key, perm))
      ) {
        return;
      }

      // User's own global role
      const userRoles = await prisma.userRole.findFirst({
        where: {
          userId: currentUser.id,
          roleId: role.id,
        },
      });

      if (userRoles) {
        return;
      }

      throw new ForbiddenException('Bu global rolü görüntüleme yetkiniz yok');
    }

    // Organization role
    const adapter = organizationRegistry.get(role.organizationType);
    if (!adapter) {
      throw new ForbiddenException('Bu rolü görüntüleme yetkiniz yok');
    }

    const orgUuid = await adapter.getOrganizationUuid(role.organizationId);
    if (!orgUuid) {
      throw new ForbiddenException('Bu rolü görüntüleme yetkiniz yok');
    }

    // SHOW_ALL_ORGANIZATIONS permission
    if (
      claims.global.some((perm) =>
        matchesWildcard(PERMISSIONS.ROLE_VIEW.SHOW_ALL_ORGANIZATIONS.key, perm),
      )
    ) {
      return;
    }

    // Organization member
    const orgPermissions = claims.organizations[role.organizationType]?.[orgUuid];
    if (orgPermissions && orgPermissions.length > 0) {
      return;
    }

    // User's own role
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: currentUser.id,
        roleId: role.id,
      },
    });

    if (userRole) {
      return;
    }

    throw new ForbiddenException('Bu rolü görüntüleme yetkiniz yok');
  }
}
