import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { CompanyRole, CompanyRoleFilters, CompanyRoleMemberResponse } from '../types';

/**
 * Query Options for Company Roles
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 COMPANY ROLES LIST QUERY
// ====================================================================
export const companyRolesListQueryOptions = (
  companyUuid: string,
  filters?: CompanyRoleFilters,
) =>
  queryOptions({
    queryKey: ['company-roles', companyUuid, filters],
    queryFn: async () => {
      const queryFilters = {
        ...filters,
        organizationType: 'COMPANY' as const,
        organizationUuid: companyUuid,
      };

      const response = await api.auth.roles.get({
        // biome-ignore lint/suspicious/noExplicitAny: Eden API type inference issue
        query: queryFilters as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch company roles');
      }

      return response.data as CompanyRole[];
    },
    enabled: !!companyUuid,
  });

// ====================================================================
// 📨 SINGLE COMPANY ROLE QUERY
// ====================================================================
export const companyRoleQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['company-role', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).get();

      if (response.error) {
        throw new Error('Failed to fetch company role');
      }

      return response.data as CompanyRole;
    },
    enabled: !!uuid,
  });

// ====================================================================
// 👥 COMPANY ROLE MEMBERS QUERY
// ====================================================================
export const companyRoleMembersQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['company-role-members', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).members.get();

      if (response.error) {
        throw new Error('Failed to fetch company role members');
      }

      return response.data as CompanyRoleMemberResponse[];
    },
    enabled: !!uuid,
  });
