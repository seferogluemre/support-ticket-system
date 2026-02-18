/**
 * Core Permission Helper Functions
 *
 * Generic, reusable higher-level permission checking utilities.
 * These functions can be used across any project.
 */

import type { AuthMeResponse, OrganizationType } from '#types/api';
import { hasAnyPermission, hasAllPermissions, type PermissionInput } from './checks';

/**
 * Options for permission checking
 */
export interface CheckPermissionOptions {
  /** Required permission(s) - can be a single permission or array (string keys or objects) */
  permissions: PermissionInput | PermissionInput[];
  /** Require ALL permissions (default: false - requires ANY) */
  requireAll?: boolean;
  /** Organization UUID for organization-scoped permissions (optional) */
  organizationUuid?: string;
  /** Organization type for organization-scoped permissions (optional) */
  organizationType?: OrganizationType;
  /** Check if user has permission in ANY organization of the specified type (optional) */
  checkInAnyOrganization?: boolean;
  /** Fallback permission(s) to check if primary fails (optional) */
  fallbackPermissions?: PermissionInput | PermissionInput[];
}

/**
 * Comprehensive permission check - handles all permission patterns
 *
 * Supports:
 * 1. Single or multiple permissions
 * 2. Global permissions
 * 3. Organization-scoped permissions
 * 4. Fallback permissions (global OR organization)
 * 5. Permission in ANY organization
 *
 * @example
 * ```ts
 * // 1. Simple permission
 * const canCreate = checkPermission(session, {
 *   permissions: 'users:create'
 * });
 *
 * // 2. Multiple permissions (ANY)
 * const canManage = checkPermission(session, {
 *   permissions: ['users:create', 'users:update']
 * });
 *
 * // 3. Multiple permissions (ALL required)
 * const canFullyManage = checkPermission(session, {
 *   permissions: ['users:show', 'users:update'],
 *   requireAll: true
 * });
 *
 * // 4. Organization-scoped
 * const canCreateProject = checkPermission(session, {
 *   permissions: 'projects:create',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 5. Fallback pattern (global OR organization)
 * const canListProjects = checkPermission(session, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-organization',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 6. Permission in ANY organization
 * const canCreateAnywhere = checkPermission(session, {
 *   permissions: 'projects:create',
 *   organizationType: OrganizationType.COMPANY,
 *   checkInAnyOrganization: true
 * });
 * ```
 */
export function checkPermission(
  session: AuthMeResponse | undefined,
  options: CheckPermissionOptions,
): boolean {
  const {
    permissions,
    requireAll = false,
    organizationUuid,
    organizationType,
    checkInAnyOrganization = false,
    fallbackPermissions,
  } = options;

  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  const fallbackArray = fallbackPermissions
    ? Array.isArray(fallbackPermissions)
      ? fallbackPermissions
      : [fallbackPermissions]
    : [];

  let hasRequiredPermissions = false;

  // Check primary permissions
  if (checkInAnyOrganization && organizationType) {
    // Check if user has permission in ANY organization of the specified type
    if (session?.claims?.organizations?.[organizationType]) {
      const orgsOfType = session.claims.organizations[organizationType];
      for (const orgUuid of Object.keys(orgsOfType)) {
        const checkResult = requireAll
          ? hasAllPermissions(session, permissionsArray, orgUuid, organizationType)
          : hasAnyPermission(session, permissionsArray, orgUuid, organizationType);

        if (checkResult) {
          hasRequiredPermissions = true;
          break;
        }
      }
    }
  } else if (organizationUuid && organizationType) {
    // Organization-scoped check
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(session, permissionsArray, organizationUuid, organizationType)
      : hasAnyPermission(session, permissionsArray, organizationUuid, organizationType);
  } else {
    // Global check
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(session, permissionsArray)
      : hasAnyPermission(session, permissionsArray);
  }

  // If primary check fails and fallback is provided, check fallback
  if (!hasRequiredPermissions && fallbackArray.length > 0) {
    if (checkInAnyOrganization && organizationType) {
      // Check fallback in ANY organization
      if (session?.claims?.organizations?.[organizationType]) {
        const orgsOfType = session.claims.organizations[organizationType];
        for (const orgUuid of Object.keys(orgsOfType)) {
          const checkResult = requireAll
            ? hasAllPermissions(session, fallbackArray, orgUuid, organizationType)
            : hasAnyPermission(session, fallbackArray, orgUuid, organizationType);

          if (checkResult) {
            hasRequiredPermissions = true;
            break;
          }
        }
      }
    } else if (organizationUuid && organizationType) {
      hasRequiredPermissions = requireAll
        ? hasAllPermissions(session, fallbackArray, organizationUuid, organizationType)
        : hasAnyPermission(session, fallbackArray, organizationUuid, organizationType);
    } else {
      hasRequiredPermissions = requireAll
        ? hasAllPermissions(session, fallbackArray)
        : hasAnyPermission(session, fallbackArray);
    }
  }

  return hasRequiredPermissions;
}

/**
 * Get multiple permission checks at once
 * Returns an object with all permission check results
 *
 * @example
 * ```ts
 * const permissions = checkPermissions(session, {
 *   canCreate: { permissions: 'users:create' },
 *   canUpdate: { permissions: 'users:update' },
 *   canDelete: { permissions: 'users:delete' },
 *   canManage: { permissions: ['users:create', 'users:update'] },
 * });
 * ```
 */
export function checkPermissions<T extends Record<string, CheckPermissionOptions>>(
  session: AuthMeResponse | undefined,
  permissionMap: T,
): Record<keyof T, boolean> {
  const result: Record<string, boolean> = {};

  for (const [key, options] of Object.entries(permissionMap)) {
    result[key] = checkPermission(session, options);
  }

  return result as Record<keyof T, boolean>;
}
