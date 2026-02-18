/**
 * Company-Specific Guards
 *
 * Project-specific guard implementations for company-related routes.
 * These guards are specific to this project's company structure.
 */

import type { AppSession, AppRouteContext } from '../../config';
import { defineGuard, type RouteGuardResult } from '../../core';
import {
  checkCompanyPermission,
  type CheckCompanyPermissionOptions,
} from '#lib/auth/permissions/adapters/company';

// ============================================================================
// Guard Options Types
// ============================================================================

/**
 * Company permission guard options
 * Extends CheckCompanyPermissionOptions with guard-specific options
 */
export interface CompanyPermissionGuardOptions
  extends Omit<CheckCompanyPermissionOptions, 'companyUuid'> {
  /** Whether to use current company from context (default: true) */
  useCurrentCompany?: boolean;
  /** Specific company UUID (overrides useCurrentCompany) */
  companyUuid?: string;
  /** Redirect path if permission check fails (default: uses getDefaultRedirect) */
  redirectTo?: string;
}

// ============================================================================
// Company-Specific Guard
// ============================================================================

/**
 * Company permission guard - convenience wrapper for company-scoped permissions
 *
 * Automatically uses current company from context and OrganizationType.COMPANY.
 * Supports fallback permissions for "global OR company" patterns.
 *
 * @example
 * ```ts
 * // 1. Simple company permission (uses current company)
 * guards.requireCompanyPermission(context, {
 *   permissions: 'projects:create'
 * });
 *
 * // 2. Multiple permissions (ANY)
 * guards.requireCompanyPermission(context, {
 *   permissions: ['projects:show', 'projects:create']
 * });
 *
 * // 3. Multiple permissions (ALL required)
 * guards.requireCompanyPermission(context, {
 *   permissions: ['projects:show', 'projects:update'],
 *   requireAll: true
 * });
 *
 * // 4. Specific company
 * guards.requireCompanyPermission(context, {
 *   permissions: 'projects:create',
 *   companyUuid: 'specific-company-uuid'
 * });
 *
 * // 5. Fallback pattern (global OR company)
 * guards.requireCompanyPermission(context, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-company'
 * });
 *
 * // 6. Permission in ANY company
 * guards.requireCompanyPermission(context, {
 *   permissions: 'projects:create',
 *   checkInAnyCompany: true
 * });
 *
 * // 7. ANY access to company (any permission - no specific permission needed)
 * guards.requireCompanyPermission(context, {
 *   requireAnyAccess: true
 * });
 * ```
 */
export const requireCompanyPermissionGuard = defineGuard<
  AppSession,
  AppRouteContext,
  CompanyPermissionGuardOptions,
  RouteGuardResult<AppSession>
>({
  handler: (context, session, helpers, options) => {
    if (!session) {
      helpers.redirectTo('/sign-in');
    }

    const {
      useCurrentCompany = true,
      companyUuid: specificCompanyUuid,
      redirectTo: customRedirect,
      ...checkOptions
    } = options;

    // Determine which company to check
    const companyUuid =
      specificCompanyUuid || (useCurrentCompany ? context.currentCompany?.uuid : undefined);

    // Use utility function for permission checking
    const hasRequiredPermissions = checkCompanyPermission(session, {
      ...checkOptions,
      companyUuid,
    });

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
