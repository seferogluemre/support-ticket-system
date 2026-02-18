/**
 * Core Permission Hooks
 *
 * Generic, reusable React hooks for permission checking.
 * These hooks can be used across any project.
 */

import { useMemo } from 'react';
import { useSession } from '#/hooks/use-session';
import { hasSystemScope } from './checks';
import { checkPermission, checkPermissions, type CheckPermissionOptions } from './helpers';

// ============================================================================
// Generic Permission Hooks
// ============================================================================

/**
 * Comprehensive permission check hook - handles all permission patterns
 *
 * @example
 * ```tsx
 * // 1. Simple permission
 * const canCreate = usePermission({ permissions: 'users:create' });
 *
 * // 2. Multiple permissions (ANY)
 * const canManage = usePermission({
 *   permissions: ['users:create', 'users:update']
 * });
 *
 * // 3. Multiple permissions (ALL required)
 * const canFullyManage = usePermission({
 *   permissions: ['users:show', 'users:update'],
 *   requireAll: true
 * });
 *
 * // 4. Organization-scoped
 * const canCreateProject = usePermission({
 *   permissions: 'projects:create',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 5. Fallback pattern (global OR organization)
 * const canListProjects = usePermission({
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-organization',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 * ```
 */
export function usePermission(options: CheckPermissionOptions): boolean {
  const { session } = useSession();

  const {
    permissions,
    requireAll,
    organizationUuid,
    organizationType,
    checkInAnyOrganization,
    fallbackPermissions,
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
    () => checkPermission(session, options),
    [
      session,
      permissionsKey,
      requireAll,
      organizationUuid,
      organizationType,
      checkInAnyOrganization,
      fallbackPermissionsKey,
    ],
  );
}


/**
 * Hook to check if current user has system scope
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasSystem = useSystemScope();
 *
 *   return (
 *     <>
 *       {hasSystem && <SystemAdminPanel />}
 *     </>
 *   );
 * }
 * ```
 */
export function useSystemScope(): boolean {
  const { session } = useSession();
  return useMemo(() => hasSystemScope(session), [session]);
}

/**
 * Hook to get multiple permission checks at once
 * Returns an object with all permission check results
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const permissions = usePermissions({
 *     canCreate: { permissions: 'users:create' },
 *     canUpdate: { permissions: 'users:update' },
 *     canDelete: { permissions: 'users:delete' },
 *     canManage: { permissions: ['users:create', 'users:update', 'users:delete'] },
 *   });
 *
 *   return (
 *     <>
 *       {permissions.canCreate && <CreateButton />}
 *       {permissions.canUpdate && <UpdateButton />}
 *       {permissions.canDelete && <DeleteButton />}
 *       {permissions.canManage && <ManagePanel />}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermissions<T extends Record<string, CheckPermissionOptions>>(
  permissionMap: T,
): Record<keyof T, boolean> {
  const { session } = useSession();

  // Serialize permissionMap for stable dependency
  const permissionMapKey = useMemo(() => JSON.stringify(permissionMap), [permissionMap]);

  return useMemo(() => checkPermissions(session, permissionMap), [session, permissionMapKey]);
}
