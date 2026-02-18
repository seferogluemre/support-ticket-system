/**
 * Permission System
 *
 * Centralized permission checking utilities for the application.
 * Provides both low-level checks and high-level helpers for common patterns.
 *
 * ## Structure
 *
 * - `core/` - Generic, reusable permission utilities (can be used across projects)
 *   - `checks.ts` - Core permission checking functions (hasPermission, etc.)
 *   - `helpers.ts` - High-level permission checking utilities (checkPermission, etc.)
 *   - `hooks.ts` - Generic React hooks
 * - `adapters/` - Project-specific permission utilities
 *   - `company.ts` - Company-specific permission utilities
 *   - `hooks.ts` - Company-specific React hooks
 *
 * ## Usage
 *
 * ### In Components (with hooks)
 *
 * ```tsx
 * import { usePermission, useCompanyPermission } from '#lib/auth/permissions';
 *
 * function MyComponent() {
 *   const canCreate = usePermission({ permissions: 'users:create' });
 *   const canManageProjects = useCompanyPermission({
 *     permissions: 'projects:update',
 *     companyUuid
 *   });
 *
 *   return (
 *     <>
 *       {canCreate && <CreateButton />}
 *       {canManageProjects && <ManageButton />}
 *     </>
 *   );
 * }
 * ```
 *
 * ### In Route Guards
 *
 * ```ts
 * import { checkPermission } from '#lib/auth/permissions';
 *
 * const hasAccess = checkPermission(session, {
 *   permissions: 'users:show',
 *   fallbackPermissions: 'users:list-own'
 * });
 * ```
 *
 * ### Direct Permission Checks
 *
 * ```ts
 * import { hasPermission, hasSystemScope } from '#lib/auth/permissions';
 *
 * if (hasPermission(session, 'users:create')) {
 *   // User can create users
 * }
 *
 * if (hasSystemScope(session)) {
 *   // User has system scope
 * }
 * ```
 */

// ============================================================================
// Core Permission System (Generic - Reusable)
// ============================================================================

export {
  // Basic permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasPermissionInAnyOrganization,
  matchesWildcard,
  // System scope check
  hasSystemScope,
  // Convenience functions
  getOrganizationPermissions,
  getGlobalPermissions,
  hasAnyPermissions,
  // High-level permission checking
  checkPermission,
  checkPermissions,
  // Generic hooks
  usePermission,
  usePermissions,
  // Scope hooks
  useSystemScope,
  // Types
  type PermissionKey,
  type AppSession,
  type CheckPermissionOptions,
} from './core';

// ============================================================================
// Project-Specific Adapters
// ============================================================================

export {
  // Company scope check
  hasCompanyScope,
  // Company permission checking
  checkCompanyPermission,
  checkCompanyPermissions,
  // Company hooks
  useCompanyPermission,
  useCompanyPermissions,
  useCompanyAccess,
  // Company scope hook
  useCompanyScope,
  // Types
  type CheckCompanyPermissionOptions,
} from './adapters';

// ============================================================================
// Permission Constants (from backend)
// ============================================================================

// Re-export permission constants from API for type-safe permission keys
export { PERMISSIONS } from '#backend/modules/auth/authorization/permissions/constants';
