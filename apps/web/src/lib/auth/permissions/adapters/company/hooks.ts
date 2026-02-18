/**
 * Company-Specific Permission Hooks
 *
 * React hooks for company-related permission checking.
 */

import { useMemo } from 'react';
import { useSession } from '#/hooks/use-session';
import { hasCompanyScope } from './checks';
import {
  checkCompanyPermission,
  checkCompanyPermissions,
  type CheckCompanyPermissionOptions,
} from './helpers';

// ============================================================================
// Company-Specific Permission Hooks
// ============================================================================

/**
 * Company permission check hook - convenience wrapper for company-scoped permissions
 *
 * @example
 * ```tsx
 * // 1. Simple company permission
 * const canCreate = useCompanyPermission({
 *   permissions: 'projects:create',
 *   companyUuid
 * });
 *
 * // 2. Multiple permissions (ANY)
 * const canManage = useCompanyPermission({
 *   permissions: ['projects:create', 'projects:update'],
 *   companyUuid
 * });
 *
 * // 3. Fallback pattern (global OR company)
 * const canListProjects = useCompanyPermission({
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-company',
 *   companyUuid
 * });
 * ```
 */
export function useCompanyPermission(options: CheckCompanyPermissionOptions): boolean {
  const { session } = useSession();

  const {
    permissions,
    requireAll,
    organizationUuid,
    checkInAnyOrganization,
    fallbackPermissions,
    companyUuid,
    checkInAnyCompany,
    requireAnyAccess,
  } = options;

  // Serialize array permissions for stable dependency
  const permissionsKey = useMemo(
    () => (Array.isArray(permissions) ? JSON.stringify(permissions) : permissions),
    [permissions],
  );

  const fallbackPermissionsKey = useMemo(
    () =>
      Array.isArray(fallbackPermissions)
        ? JSON.stringify(fallbackPermissions)
        : fallbackPermissions,
    [fallbackPermissions],
  );

  return useMemo(
    () => checkCompanyPermission(session, options),
    [
      session,
      permissionsKey,
      requireAll,
      organizationUuid,
      checkInAnyOrganization,
      fallbackPermissionsKey,
      companyUuid,
      checkInAnyCompany,
      requireAnyAccess,
    ],
  );
}

/**
 * Hook to get multiple company permission checks at once
 * Returns an object with all permission check results
 *
 * @example
 * ```tsx
 * function MyComponent({ companyUuid }) {
 *   const permissions = useCompanyPermissions({
 *     canCreate: { permissions: 'projects:create' },
 *     canUpdate: { permissions: 'projects:update' },
 *     canDelete: { permissions: 'projects:delete' },
 *   }, companyUuid);
 *
 *   return (
 *     <>
 *       {permissions.canCreate && <CreateButton />}
 *       {permissions.canUpdate && <UpdateButton />}
 *       {permissions.canDelete && <DeleteButton />}
 *     </>
 *   );
 * }
 * ```
 */
export function useCompanyPermissions<T extends Record<string, CheckCompanyPermissionOptions>>(
  permissionMap: T,
  companyUuid?: string,
): Record<keyof T, boolean> {
  const { session } = useSession();

  // Serialize permissionMap for stable dependency
  const permissionMapKey = useMemo(() => JSON.stringify(permissionMap), [permissionMap]);

  return useMemo(
    () => checkCompanyPermissions(session, permissionMap, companyUuid),
    [session, permissionMapKey, companyUuid],
  );
}

/**
 * Hook to check if user has ANY access to a company
 *
 * @example
 * ```tsx
 * function CompanyDashboard({ companyUuid }) {
 *   const hasAccess = useCompanyAccess(companyUuid);
 *
 *   if (!hasAccess) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <Dashboard />;
 * }
 * ```
 */
export function useCompanyAccess(companyUuid: string): boolean {
  const { session } = useSession();

  return useMemo(
    () =>
      checkCompanyPermission(session, {
        permissions: '*',
        requireAnyAccess: true,
        companyUuid,
      }),
    [session, companyUuid],
  );
}

/**
 * Hook to check if current user has company scope
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasCompany = useCompanyScope();
 *
 *   if (hasCompany) {
 *     // User is limited to company features
 *   }
 * }
 * ```
 */
export function useCompanyScope(): boolean {
  const { session } = useSession();
  return useMemo(() => hasCompanyScope(session), [session]);
}
