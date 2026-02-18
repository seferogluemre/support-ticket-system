import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { CompanyMember, CompanyMemberDetails } from '../types';

/**
 * Query Options for Company Members
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 COMPANY MEMBERS LIST QUERY
// ====================================================================
export const companyMembersListQueryOptions = (companyUuid: string) =>
  queryOptions({
    queryKey: ['company-members', companyUuid],
    queryFn: async () => {
      const response = await api.auth.organizations
        .company({ organizationUuid: companyUuid })
        .members.get();

      if (response.error) {
        throw new Error('Failed to fetch company members');
      }

      return response.data as CompanyMember[];
    },
    enabled: !!companyUuid,
  });

// ====================================================================
// 👤 SINGLE COMPANY MEMBER QUERY
// ====================================================================
export const companyMemberQueryOptions = (companyUuid: string, userId: string) =>
  queryOptions({
    queryKey: ['company-member', companyUuid, userId],
    queryFn: async () => {
      const response = await api.auth.organizations
        .company({ organizationUuid: companyUuid })
        .members({ userId }).get();

      if (response.error) {
        throw new Error('Failed to fetch company member');
      }

      return response.data as CompanyMemberDetails;
    },
    enabled: !!companyUuid && !!userId,
  });