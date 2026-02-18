/**
 * Core Permission System
 *
 * Generic, reusable permission checking utilities.
 * These can be used across any project.
 */

// Core permission checks
export {
  // Basic permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasPermissionInAnyOrganization,
  matchesWildcard,
  // Scope checks
  hasSystemScope,
  // Convenience functions
  getOrganizationPermissions,
  getGlobalPermissions,
  hasAnyPermissions,
  // Types
  type PermissionKey,
  type PermissionObject,
  type PermissionInput,
  type AppSession,
} from './checks';

// Permission helpers
export {
  // High-level permission checking
  checkPermission,
  checkPermissions,
  // Types
  type CheckPermissionOptions,
} from './helpers';

// React hooks
export {
  // Generic permission hooks
  usePermission,
  usePermissions,
  // Scope hooks
  useSystemScope,
} from './hooks';
