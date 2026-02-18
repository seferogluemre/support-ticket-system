import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { Company, CompanyFilters } from '../types';

/**
 * Query Options for Companies
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 COMPANIES LIST QUERY
// ====================================================================
export const companiesListQueryOptions = (filters?: CompanyFilters) =>
  queryOptions({
    queryKey: ['companies', filters],
    queryFn: async () => {
      const response = await api.companies.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch companies');
      }

      return response.data?.data as Company[];
    },
  });

// ====================================================================
// 📨 SINGLE COMPANY QUERY
// ====================================================================
export const companyQueryOptions = (companyUuid: string) =>
  queryOptions({
    queryKey: ['company', companyUuid],
    queryFn: async () => {
      const response = await api.companies({ uuid: companyUuid }).get();

      if (response.error) {
        throw new Error('Failed to fetch company');
      }

      return response.data as Company;
    },
    enabled: !!companyUuid,
  });
