import type { OrganizationType } from '@onlyjs/db/enums';
import type { PermissionKey } from '../permissions/types';

/**
 * Minimal role info (stored in user.roles field)
 * Frontend can fetch full role details by UUID if needed
 */
export interface UserRoleInfo {
  uuid: string;
  /** Only present for organization-specific roles */
  organizationType?: OrganizationType;
  /** Only present for organization-specific roles */
  organizationUuid?: string;
}

/**
 * User claims (permissions only)
 * Cached in DB (user.claims field) and memory for performance
 */
export interface UserClaims {
  /**
   * Global permissions - wildcards preserved as-is (e.g., "*", "users:*")
   * Permission checks should handle wildcard matching
   */
  global: PermissionKey[];
  
  /**
   * Organization-based permissions (UUID-keyed)
   * Format: { organizationType: { organizationUuid: permissions[] } }
   */
  organizations: Record<string, Record<string, PermissionKey[]>>;
}
