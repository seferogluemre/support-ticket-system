import type { QueryClient } from '@tanstack/react-query';
import type { AuthMeResponse, CompanyResponse } from './api';

/**
 * Simplified company info extracted from organization memberships
 * Used in the router context for quick access to user's companies
 */
export interface CompanyMembershipInfo {
  uuid: string;
  name: string;
  logoSrc?: string | null;
  _membership: {
    isAdmin: boolean;
    isOwner: boolean;
    joinedAt: string;
  };
}

/**
 * Router context type
 * Contains authentication and company data loaded in _authenticated route
 */
export interface RouterContext {
  queryClient: QueryClient;
  /** User session data */
  session?: AuthMeResponse;
  /** User's companies extracted from organization memberships (simplified) */
  companies?: CompanyMembershipInfo[];
  /** Currently selected company (full data, may be fetched separately for system admins) */
  currentCompany?: CompanyResponse | CompanyMembershipInfo | null;
  /** Total number of companies in the system (for system admins) */
  totalCompanyCount?: number;
}
