import { api } from '#/lib/api';
import { OrganizationType } from '#types/api.ts';
import { queryOptions } from '@tanstack/react-query';

/**
 * Query Options for Company Permissions
 */

// ====================================================================
// 📋 COMPANY PERMISSIONS LIST QUERY
// ====================================================================
export const companyPermissionsListQueryOptions = () =>
  queryOptions({
    queryKey: ['company-permissions'],
    queryFn: async () => {
      const response = await api.auth.permissions.get({
        // biome-ignore lint/suspicious/noExplicitAny: API query type
        query: { organizationType: OrganizationType.COMPANY } as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch company permissions');
      }

      return response.data as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  });

// ====================================================================
// 📦 COMPANY PERMISSION GROUPS QUERY
// ====================================================================
export const companyPermissionGroupsQueryOptions = () =>
  queryOptions({
    queryKey: ['company-permission-groups'],
    queryFn: async () => {
      const response = await api.auth.permissions.groups.get({
        // biome-ignore lint/suspicious/noExplicitAny: API query type
        query: { organizationType: 'COMPANY' } as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch company permission groups');
      }

      return response.data as Record<
        string,
        {
          key: string;
          description: string;
          permissions: Array<{
            key: string;
            description: string;
            scopes: string[];
          }>;
        }
      >;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  });
