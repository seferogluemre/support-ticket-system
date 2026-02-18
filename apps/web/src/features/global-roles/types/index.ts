/**
 * Global Roles Types
 */

import type { RoleType } from '#/features/authorization';

export interface GlobalRoleMemberPreview {
  uuid: string;
  name: string;
  image: string | null;
}

export interface GlobalRole {
  uuid: string;
  name: string;
  description: string | null;
  type: RoleType;
  order: number;
  permissions: string[];
  organizationType: string | null;
  organizationUuid: string | null;
  memberCount?: number;
  memberPreview?: GlobalRoleMemberPreview[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GlobalRoleFilters {
  search?: string;
  type?: RoleType;
}

export interface GlobalRoleMember {
  uuid: string;
  name: string;
  email: string;
  image: string | null;
  assignedAt: Date | string;
}

export interface CreateGlobalRoleInput {
  name: string;
  description?: string | null;
  type: RoleType;
  order?: number;
  permissions: string[];
}

export interface UpdateGlobalRoleInput {
  name?: string;
  description?: string | null;
  type?: RoleType;
  order?: number;
  permissions?: string[];
}