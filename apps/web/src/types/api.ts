/**
 * Central API Types
 *
 * Bu dosya backend'ten gelen tüm type'ları re-export eder.
 * Frontend kodunda backend type'larına direkt import yerine bu dosyadan import yapılmalı.
 *
 * Avantajlar:
 * - Type'ların tek bir merkezi kaynağı
 * - Backend path değişikliklerinde tek bir dosyayı güncellemek yeterli
 * - Frontend-backend arasında net bir sınır
 */

// ============================================================================
// Post Module Types
// ============================================================================

// Post Types
export type * from '#backend/modules/posts/types';

// ============================================================================
// Company Module Types
// ============================================================================

export type {
  CompanyCreatePayload,
  CompanyResponse,
  CompanyUpdatePayload,
} from '#backend/modules/companies/types';

// ============================================================================
// Auth Module Types
// ============================================================================

// Authentication Types
export type { AuthMeResponse } from '#backend/modules/auth/authentication/types';

// Authorization Types
export type {
  RoleCreatePayload,
  RoleIndexQuery,
  RoleMemberResponse,
  RoleResponseDto,
  RoleShowResponse,
  RoleUpdatePayload,
} from '#backend/modules/auth/authorization/roles/types';

export { OrganizationType, UserScope } from '@onlyjs/db/enums';

export type { OrganizationMembershipSummary } from '#backend/modules/auth/authorization/organizations/types';

// ============================================================================
// Users Module Types
// ============================================================================

export type {
  RecordStatus,
  Status,
  UserCreatePayload,
  UserCreateResponse,
  UserIndexQuery,
  UserShowResponse,
  UserUpdatePayload,
} from '#backend/modules/users/types';

// ============================================================================
// Organization Members Types
// ============================================================================

export type {
  CompanyMember,
  CompanyMemberCreatePayload,
  CompanyMemberCreateResponse,
  CompanyMemberDetails,
  CompanyMemberUpdatePayload,
  CompanyMemberUpdateResponse,
} from '#backend/modules/auth/authorization/organizations/types/company.types';

export type { Gender } from '@onlyjs/db/enums';

// ============================================================================
// WebSocket Types
// ============================================================================

// WebSocket Types
/* export type {
  CompanyMemberStatusUpdateData,
  ClientCompanyMemberStatusUpdate,
  ClientWebSocketMessage,
  ErrorData,
  WSConnectionData
} from '#backend/modules/websocket/types'; */

// Dummy types for now
type MemberStatusUpdateData = {};
type ClientCompanyMemberStatusUpdate = {};
type ClientWebSocketMessage = {};
type ServerWebSocketMessage = {};
type ErrorData = {};
type WSConnectionData = {};

export type {
 MemberStatusUpdateData,
 ClientCompanyMemberStatusUpdate,
 ClientWebSocketMessage,
 ServerWebSocketMessage,
 ErrorData,
 WSConnectionData
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    pageCount: number;
  };
}
