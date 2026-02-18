// ====================================================================
// 📨 BACKEND TYPES - Backend'den direkt import
// ====================================================================

export type {
  RoleResponseDto as CompanyRole,
  RoleCreatePayload as CompanyRoleCreatePayload,
  RoleUpdatePayload as CompanyRoleUpdatePayload,
  RoleMemberResponse as CompanyRoleMemberResponse,
  RoleShowResponse as CompanyRoleShowResponse,
} from '#backend/modules/auth/authorization/roles/types';

// Query types için backend'den import
export type { Static } from 'elysia';
import type { roleIndexDto } from '#backend/modules/auth/authorization/roles/dtos';
import { Static } from 'elysia';

export type CompanyRoleFilters = Static<typeof roleIndexDto.query>;
