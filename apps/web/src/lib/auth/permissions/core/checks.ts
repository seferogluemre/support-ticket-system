/**
 * Core Permission Checking Utilities
 *
 * Generic, reusable permission checking functions.
 * These functions can be used across any project.
 */

import type { AuthMeResponse } from '#types/api';
import { OrganizationType, UserScope } from '#types/api';

// Import and re-export permission types from backend
import type {
  PermissionKey,
  PermissionObject,
  PermissionIdentifier,
} from '#backend/modules/auth/authorization/permissions/types';

export type { PermissionKey, PermissionObject };
export type PermissionInput = PermissionIdentifier;

/**
 * Helper to extract permission key from input
 */
function extractPermissionKey(input: PermissionInput): PermissionKey {
  return typeof input === 'string' ? input : input.key;
}

/**
 * Session type alias for convenience
 */
export type AppSession = AuthMeResponse;

// ============================================================================
// Core Permission Checking
// ============================================================================

/**
 * Wildcard permission matching (client-side implementation)
 * @param permission Permission to check (e.g., "users:show")
 * @param wildcard Wildcard pattern (e.g., "*", "users:*")
 * @returns true if permission matches the wildcard pattern
 *
 * @example
 * ```ts
 * matchesWildcard('users:show', '*'); // true
 * matchesWildcard('users:show', 'users:*'); // true
 * matchesWildcard('users:show', 'users:show'); // true
 * matchesWildcard('users:show', 'posts:*'); // false
 * ```
 */
export function matchesWildcard(permission: PermissionKey, wildcard: PermissionKey): boolean {
  // Global wildcard
  if (wildcard === '*') return true;

  // Exact match
  if (wildcard === permission) return true;

  // Prefix wildcard (e.g., "users:*" matches "users:show")
  if (wildcard.endsWith(':*')) {
    const prefix = wildcard.slice(0, -1); // Remove "*" (keep ":")
    return permission.startsWith(prefix);
  }

  return false;
}

/**
 * Check if user has a specific permission
 * @param session User session with claims
 * @param permission Permission to check (string key or permission object)
 * @param organizationUuid Optional organization UUID for organization-scoped permissions
 * @param organizationType Optional organization type
 *
 * @example
 * ```ts
 * // Global permission with string
 * hasPermission(session, 'users:show');
 *
 * // Global permission with object
 * hasPermission(session, PERMISSIONS.USER_BASIC.SHOW);
 *
 * // Organization-scoped permission
 * hasPermission(session, PERMISSIONS.PROJECTS.CREATE, companyUuid, OrganizationType.COMPANY);
 * ```
 */
export function hasPermission(
  session: AppSession | undefined,
  permission: PermissionInput,
  organizationUuid?: string,
  organizationType?: OrganizationType,
): boolean {
  if (!session?.claims) return false;

  const permissionKey = extractPermissionKey(permission);

  // Check global permissions (with wildcard matching)
  for (const claimPerm of session.claims.global) {
    if (matchesWildcard(permissionKey, claimPerm)) {
      return true;
    }
  }

  // Check organization-specific permissions if provided
  if (organizationUuid && organizationType) {
    const orgClaims = session.claims.organizations?.[organizationType]?.[organizationUuid];
    if (orgClaims) {
      for (const claimPerm of orgClaims) {
        if (matchesWildcard(permissionKey, claimPerm)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if user has ANY of the specified permissions
 * @param session User session with claims
 * @param permissions Array of permissions to check (strings or objects)
 * @param organizationUuid Optional organization UUID
 * @param organizationType Optional organization type
 *
 * @example
 * ```ts
 * // User needs at least one of these permissions
 * hasAnyPermission(session, [PERMISSIONS.USER_BASIC.CREATE, PERMISSIONS.USER_BASIC.UPDATE]);
 * ```
 */
export function hasAnyPermission(
  session: AppSession | undefined,
  permissions: PermissionInput[],
  organizationUuid?: string,
  organizationType?: OrganizationType,
): boolean {
  return permissions.some((perm) =>
    hasPermission(session, perm, organizationUuid, organizationType),
  );
}

/**
 * Check if user has ALL of the specified permissions
 * @param session User session with claims
 * @param permissions Array of permissions to check (strings or objects)
 * @param organizationUuid Optional organization UUID
 * @param organizationType Optional organization type
 *
 * @example
 * ```ts
 * // User needs all of these permissions
 * hasAllPermissions(session, [PERMISSIONS.USER_BASIC.SHOW, PERMISSIONS.USER_BASIC.UPDATE]);
 * ```
 */
export function hasAllPermissions(
  session: AppSession | undefined,
  permissions: PermissionInput[],
  organizationUuid?: string,
  organizationType?: OrganizationType,
): boolean {
  return permissions.every((perm) =>
    hasPermission(session, perm, organizationUuid, organizationType),
  );
}

/**
 * Check if user has permission in ANY organization of the specified type
 * @param session User session with claims
 * @param permission Permission to check (string or object)
 * @param organizationType Organization type to check
 *
 * @example
 * ```ts
 * // Does user have this permission in any company?
 * hasPermissionInAnyOrganization(session, PERMISSIONS.PROJECTS.CREATE, OrganizationType.COMPANY);
 * ```
 */
export function hasPermissionInAnyOrganization(
  session: AppSession | undefined,
  permission: PermissionInput,
  organizationType?: OrganizationType,
): boolean {
  if (!session?.claims) return false;

  const permissionKey = extractPermissionKey(permission);

  // Check global permissions first
  for (const claimPerm of session.claims.global) {
    if (matchesWildcard(permissionKey, claimPerm)) {
      return true;
    }
  }

  // Check organization-specific permissions
  if (organizationType) {
    const orgsOfType = session.claims.organizations?.[organizationType];
    if (orgsOfType) {
      for (const orgPermissions of Object.values(orgsOfType) as PermissionKey[][]) {
        for (const claimPerm of orgPermissions) {
          if (matchesWildcard(permissionKey, claimPerm)) {
            return true;
          }
        }
      }
    }
  } else {
    // Check all organization types
    for (const orgsOfType of Object.values(session.claims.organizations || {}) as Record<
      string,
      PermissionKey[]
    >[]) {
      for (const orgPermissions of Object.values(orgsOfType) as PermissionKey[][]) {
        for (const claimPerm of orgPermissions) {
          if (matchesWildcard(permissionKey, claimPerm)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if user has system-level access
 * @param session User session
 *
 * @example
 * ```ts
 * if (hasSystemScope(session)) {
 *   // User can access system-level features
 * }
 * ```
 */
export function hasSystemScope(session: AppSession | undefined): boolean {
  return session?.scope === UserScope.SYSTEM;
}


/**
 * Get all permissions user has in a specific organization
 * @param session User session
 * @param organizationUuid Organization UUID
 * @param organizationType Organization type
 * @returns Array of permission keys (including wildcards)
 *
 * @example
 * ```ts
 * const permissions = getOrganizationPermissions(session, companyUuid, OrganizationType.COMPANY);
 * console.log(permissions); // ['projects:*', 'users:show']
 * ```
 */
export function getOrganizationPermissions(
  session: AppSession | undefined,
  organizationUuid: string,
  organizationType: OrganizationType,
): PermissionKey[] {
  if (!session?.claims) return [];

  const orgClaims = session.claims.organizations?.[organizationType]?.[organizationUuid];
  return orgClaims || [];
}

/**
 * Get all global permissions user has
 * @param session User session
 * @returns Array of permission keys (including wildcards)
 *
 * @example
 * ```ts
 * const globalPerms = getGlobalPermissions(session);
 * console.log(globalPerms); // ['*'] or ['users:*', 'posts:show']
 * ```
 */
export function getGlobalPermissions(session: AppSession | undefined): PermissionKey[] {
  if (!session?.claims) return [];
  return session.claims.global || [];
}

/**
 * Check if user has any permissions at all
 * @param session User session
 *
 * @example
 * ```ts
 * if (!hasAnyPermissions(session)) {
 *   // Redirect to onboarding
 * }
 * ```
 */
export function hasAnyPermissions(session: AppSession | undefined): boolean {
  if (!session?.claims) return false;

  // Check global permissions
  if (session.claims.global && session.claims.global.length > 0) {
    return true;
  }

  // Check organization permissions
  const orgs = session.claims.organizations || {};
  for (const orgType of Object.values(orgs)) {
    if (orgType && typeof orgType === 'object') {
      for (const orgPerms of Object.values(orgType)) {
        if (Array.isArray(orgPerms) && orgPerms.length > 0) {
          return true;
        }
      }
    }
  }

  return false;
}
