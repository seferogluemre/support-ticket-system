/**
 * Authorization Types
 * Shared types for authorization components
 */

import type { OrganizationType } from '#/types/api';

// =============================================================================
// Permission Types
// =============================================================================

export interface Permission {
  key: string;
  description: string;
  scopes: PermissionScope[];
  dependsOn?: string | string[];
  hiddenOn?: true | PermissionScope[];
}

export type PermissionScope = 'global' | OrganizationType;

export interface PermissionGroup {
  key: string;
  description: string;
  permissions: Permission[];
}

export type PermissionGroupMap = Record<string, PermissionGroup>;

// =============================================================================
// Role Types
// =============================================================================

export type RoleType = 'BASIC' | 'ADMIN' | 'CUSTOM';

export interface Role {
  uuid: string;
  name: string;
  description: string | null;
  type: RoleType;
  order: number;
  permissions: string[];
  organizationType: OrganizationType | null;
  organizationId: number | null;
  organizationUuid: string | null;
  memberCount?: number;
  memberPreview?: RoleMemberPreview[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleMemberPreview {
  uuid: string;
  name: string;
  image?: string | null;
}

export interface RoleMember {
  uuid: string;
  name: string;
  email: string;
  image?: string | null;
  assignedAt: string;
}

// =============================================================================
// User Authorization Types
// =============================================================================

export interface UserClaims {
  global: string[];
  organizations: Record<string, Record<string, string[]>>;
}

export interface DirectPermission {
  permissionCode: string;
  organizationType: OrganizationType | null;
  organizationUuid: string | null;
  createdAt: string;
}

export interface UserRoleInfo {
  uuid: string;
  organizationType?: OrganizationType;
  organizationUuid?: string;
}

// =============================================================================
// Query/Filter Types
// =============================================================================

export interface RoleFilters {
  scope?: 'global' | 'organization' | 'all';
  organizationType?: OrganizationType;
  organizationUuid?: string;
  search?: string;
  type?: RoleType;
}

export interface PermissionFilters {
  organizationType?: OrganizationType | null;
  showHidden?: boolean;
}