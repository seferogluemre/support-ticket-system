// ====================================================================
// 📨 RE-EXPORT BACKEND TYPES
// ====================================================================
// Backend'ten type'ları import edip re-export ediyoruz
// Elle type tanımlamak yerine backend ile senkronize kalıyoruz

export type {
  CompanyMember,
  CompanyMemberDetails,
  CompanyMemberCreatePayload,
  CompanyMemberCreateResponse,
  CompanyMemberUpdatePayload,
  CompanyMemberUpdateResponse,
} from '#backend/modules/auth/authorization/organizations/types/company.types';

// ====================================================================
// 🔍 FRONTEND-SPECIFIC TYPES
// ====================================================================

export interface CompanyMemberFilters extends Record<string, unknown> {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}