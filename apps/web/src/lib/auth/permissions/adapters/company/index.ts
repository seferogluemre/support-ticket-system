/**
 * Company Permission Adapter
 *
 * Project-specific utilities and hooks for company-related permissions.
 */

// Company scope and permission checks
export {
  hasCompanyScope,
  hasAnyCompanyAdminRole,
  isCompanyAdmin,
  isCompanyOwner,
  isCompanyMember,
  getUserCompanies,
  getUserAdminCompanies,
} from './checks';

// Company permission helpers
export {
  checkCompanyPermission,
  checkCompanyPermissions,
  type CheckCompanyPermissionOptions,
} from './helpers';

// Company permission hooks
export {
  useCompanyPermission,
  useCompanyPermissions,
  useCompanyAccess,
  useCompanyScope,
} from './hooks';
