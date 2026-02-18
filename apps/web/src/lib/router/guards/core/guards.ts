/**
 * Core Guard Implementation
 *
 * Generic, reusable guard that works with any organization type.
 * This is the base guard that can be used across different projects.
 */

import type { AppSession, AppRouteContext } from '../config';
import { defineGuard, type RouteGuardResult } from './system';
import { checkPermission, type CheckPermissionOptions } from '#lib/auth/permissions/core';

// ============================================================================
// Guard Options Types
// ============================================================================

/**
 * Permission guard options - extends CheckPermissionOptions with redirect
 */
export interface PermissionGuardOptions extends CheckPermissionOptions {
  /** Redirect path if permission check fails (default: uses getDefaultRedirect) */
  redirectTo?: string;
}

// ============================================================================
// Generic Permission Guard
// ============================================================================

/**
 * Comprehensive permission guard - handles all permission patterns
 *
 * Supports:
 * 1. Global permissions
 * 2. Organization-scoped permissions
 * 3. Fallback permissions (global OR organization)
 * 4. Multiple permissions (ANY or ALL)
 *
 * @example
 * ```ts
 * // 1. Simple global permission
 * guards.requirePermission(context, {
 *   permissions: 'users:show'
 * });
 *
 * // 2. Multiple permissions (ANY)
 * guards.requirePermission(context, {
 *   permissions: ['users:show', 'users:create']
 * });
 *
 * // 3. Multiple permissions (ALL required)
 * guards.requirePermission(context, {
 *   permissions: ['users:show', 'users:update'],
 *   requireAll: true
 * });
 *
 * // 4. Organization-scoped permission
 * guards.requirePermission(context, {
 *   permissions: 'projects:create',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 5. Fallback pattern (global OR organization)
 * guards.requirePermission(context, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-organization',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 6. Permission in ANY organization
 * guards.requirePermission(context, {
 *   permissions: 'projects:create',
 *   organizationType: OrganizationType.COMPANY,
 *   checkInAnyOrganization: true
 * });
 * ```
 */
export const requirePermissionGuard = defineGuard<
  AppSession,
  AppRouteContext,
  PermissionGuardOptions,
  RouteGuardResult<AppSession>
>({
  handler: (_context, session, helpers, options) => {
    if (!session) {
      helpers.redirectTo('/sign-in');
    }

    const { redirectTo: customRedirect, ...checkOptions } = options;

    // Use utility function for permission checking
    const hasRequiredPermissions = checkPermission(session, checkOptions);

    if (!hasRequiredPermissions) {
      const redirectPath = customRedirect || helpers.getDefaultRedirect();
      helpers.redirectTo(redirectPath);
    }

    return {
      allowed: true,
      session,
    };
  },
  requireAuth: true,
});
