/**
 * Route Guards Configuration
 *
 * Project-specific configuration for the route guard system.
 * This file ties together the generic guard system with project-specific guards.
 */

import type { AuthMeResponse, CompanyResponse } from '#types/api';
import type { RouterContext } from '#types/router-context';
import { createRouteGuardSystem } from './core';
import { hasSystemScope } from '#lib/auth/permissions/core';
import { hasAnyCompanyAdminRole } from '#lib/auth/permissions/adapters/company';
import { requirePermissionGuard } from './core';
import { requireCompanyPermissionGuard } from './adapters';

// ============================================================================
// Project-Specific Types
// ============================================================================

/**
 * Session type - uses AuthMeResponse from API types
 */
export type AppSession = AuthMeResponse;

/**
 * Company type - uses CompanyResponse from API types
 */
export type AppCompany = CompanyResponse;

/**
 * Route context type - uses RouterContext from router-context types
 */
export type AppRouteContext = RouterContext;

// ============================================================================
// Route Guard System
// ============================================================================

/**
 * Route guard system with minimal, powerful guards
 *
 * @example
 * ```ts
 * // 1. Simple global permission
 * beforeLoad: ({ context }) => guards.requirePermission(context, {
 *   permissions: 'users:show'
 * });
 *
 * // 2. Organization-scoped permission
 * beforeLoad: ({ context }) => guards.requirePermission(context, {
 *   permissions: 'projects:create',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 3. Fallback pattern (global OR organization)
 * beforeLoad: ({ context }) => guards.requirePermission(context, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-organization',
 *   organizationUuid: orgUuid,
 *   organizationType: OrganizationType.COMPANY
 * });
 *
 * // 4. Company permission (shorthand)
 * beforeLoad: ({ context }) => guards.requireCompanyPermission(context, {
 *   permissions: 'projects:create'
 * });
 *
 * // 5. Company fallback pattern (shorthand)
 * beforeLoad: ({ context }) => guards.requireCompanyPermission(context, {
 *   permissions: 'projects:list-all',
 *   fallbackPermissions: 'projects:list-own-company'
 * });
 * ```
 */
export const guards = createRouteGuardSystem<
  AppSession,
  AppRouteContext,
  {
    // Generic permission guard (handles everything)
    requirePermission: typeof requirePermissionGuard;
    // Company-specific guard (convenience wrapper)
    requireCompanyPermission: typeof requireCompanyPermissionGuard;
  }
>({
  getSession: (context: AppRouteContext) => context.session,
  getDefaultRedirect: (session: AppSession | undefined) => {
    if (!session) return '/sign-in';

    // Priority 1: System scope users
    if (hasSystemScope(session)) {
      return '/system-admin';
    }

    // Priority 2: Company admin users
    if (hasAnyCompanyAdminRole(session)) {
      return '/company-admin';
    }

    // Priority 3: Company member users
    return '/company-member';
  },
  unauthenticatedRedirect: '/sign-in',
  guards: {
    // Generic permission guard
    requirePermission: requirePermissionGuard,
    // Company-specific guard
    requireCompanyPermission: requireCompanyPermissionGuard,
  },
});
