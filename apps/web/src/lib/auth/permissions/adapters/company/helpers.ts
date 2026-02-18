/**
 * Company-Specific Permission Utilities
 *
 * Project-specific utility functions for company-related permission checking.
 * Convenience wrappers that automatically use OrganizationType.COMPANY.
 */

import type { AuthMeResponse } from '#types/api';
import { OrganizationType } from '#types/api';
import { checkPermission, type CheckPermissionOptions } from '../../core/helpers';

/**
 * Options for company permission checking
 * Extends CheckPermissionOptions but with company-specific defaults
 */
export interface CheckCompanyPermissionOptions
  extends Omit<CheckPermissionOptions, 'organizationType'> {
  /** Company UUID (optional - can be provided or omitted) */
  companyUuid?: string;
  /** Check if user has permission in ANY company (optional) */
  checkInAnyCompany?: boolean;
  /** Check if user has ANY access to company (any permission) (optional) */
  requireAnyAccess?: boolean;
}

/**
 * Company permission check - convenience wrapper for company-scoped permissions
 *
 * Automatically uses OrganizationType.COMPANY.
 * Supports all patterns from checkPermission plus company-specific features.
 *
 * @example
 * ```ts
 * // 1. Simple company permission
 * const canCreate = checkCompanyPermission(session, {
 *   permissions: 'projects:create',
 *   companyUuid
 * });
 *
 * // 2. Multiple permissions (ANY)
 * const canManage = checkCompanyPermission(session, {
 *   permissions: ['projects:create', 'projects:update'],
 *   companyUuid
 * });
 *
 * // 3. Multiple permissions (ALL required)
 * const canFullyManage = checkCompanyPermission(session, {
 *   permissions: ['projects:show', 'projects:update'],
 *   requireAll: true,
 *   companyUuid
 * });
 *
 * // 4. Fallback pattern (global OR company)
 * const canListProjects = checkCompanyPermission(session, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-company',
 *   companyUuid
 * });
 *
 * // 5. Permission in ANY company
 * const canCreateAnywhere = checkCompanyPermission(session, {
 *   permissions: 'projects:create',
 *   checkInAnyCompany: true
 * });
 *
 * // 6. ANY access to company (any permission)
 * const hasAccess = checkCompanyPermission(session, {
 *   permissions: '*',
 *   requireAnyAccess: true,
 *   companyUuid
 * });
 * ```
 */
export function checkCompanyPermission(
  session: AuthMeResponse | undefined,
  options: CheckCompanyPermissionOptions,
): boolean {
  const {
    companyUuid,
    checkInAnyCompany = false,
    requireAnyAccess = false,
    ...restOptions
  } = options;

  // Handle ANY access check
  if (requireAnyAccess && companyUuid) {
    if (!session?.claims) return false;
    const companyClaims = session.claims.organizations?.[OrganizationType.COMPANY]?.[companyUuid];
    const hasGlobalAccess = session.claims.global && session.claims.global.length > 0;
    return !!(companyClaims && companyClaims.length > 0) || hasGlobalAccess;
  }

  // Use generic checkPermission with company-specific settings
  return checkPermission(session, {
    ...restOptions,
    organizationUuid: companyUuid,
    organizationType: OrganizationType.COMPANY,
    checkInAnyOrganization: checkInAnyCompany,
  });
}

/**
 * Get multiple company permission checks at once
 * Returns an object with all permission check results
 *
 * @example
 * ```ts
 * const permissions = checkCompanyPermissions(session, {
 *   canCreate: { permissions: 'projects:create' },
 *   canUpdate: { permissions: 'projects:update' },
 *   canDelete: { permissions: 'projects:delete' },
 *   canManage: { permissions: ['projects:create', 'projects:update'] },
 * }, companyUuid);
 * ```
 */
export function checkCompanyPermissions<T extends Record<string, CheckCompanyPermissionOptions>>(
  session: AuthMeResponse | undefined,
  permissionMap: T,
  companyUuid?: string,
): Record<keyof T, boolean> {
  const result: Record<string, boolean> = {};

  for (const [key, options] of Object.entries(permissionMap)) {
    // Merge companyUuid if provided at batch level
    const mergedOptions =
      companyUuid && !options.companyUuid ? { ...options, companyUuid } : options;

    result[key] = checkCompanyPermission(session, mergedOptions);
  }

  return result as Record<keyof T, boolean>;
}
