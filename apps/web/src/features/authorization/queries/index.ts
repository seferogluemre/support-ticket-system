/**
 * Authorization Query Options
 * Shared query options for authorization features
 */

import { api } from '#/lib/api';
import type { OrganizationType } from '#/types/api';
import { queryOptions } from '@tanstack/react-query';
import type { PermissionGroupMap } from '../types';

// =============================================================================
// Permission Queries
// =============================================================================

/**
 * Query options for fetching permission list
 * @param organizationType - Filter by organization type (null = global only)
 */
export const permissionsQueryOptions = (organizationType?: OrganizationType | null) =>
  queryOptions({
    queryKey: ['permissions', organizationType ?? 'all'],
    queryFn: async () => {
      const response = await api.auth.permissions.get({
        // biome-ignore lint/suspicious/noExplicitAny: API query type inference
        query: (organizationType ? { organizationType } : {}) as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch permissions');
      }

      return response.data as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  });

/**
 * Query options for fetching permission groups (grouped by category)
 * @param organizationType - Filter by organization type (null = global only)
 */
export const permissionGroupsQueryOptions = (organizationType?: OrganizationType | null) =>
  queryOptions({
    queryKey: ['permission-groups', organizationType ?? 'all'],
    queryFn: async () => {
      const response = await api.auth.permissions.groups.get({
        // biome-ignore lint/suspicious/noExplicitAny: API query type inference
        query: (organizationType ? { organizationType } : {}) as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch permission groups');
      }

      return response.data as PermissionGroupMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  });

// =============================================================================
// Role Queries
// =============================================================================

export interface RoleQueryFilters {
  scope?: 'global' | 'organization';
  organizationType?: OrganizationType;
  organizationUuid?: string;
  search?: string;
}

/**
 * Query options for fetching roles list
 */
export const rolesQueryOptions = (filters?: RoleQueryFilters) =>
  queryOptions({
    queryKey: ['roles', filters],
    queryFn: async () => {
      const response = await api.auth.roles.get({
        // biome-ignore lint/suspicious/noExplicitAny: API query type
        query: filters as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch roles');
      }

      return response.data;
    },
  });

/**
 * Query options for fetching a single role
 */
export const roleQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['role', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).get();

      if (response.error) {
        throw new Error('Failed to fetch role');
      }

      return response.data;
    },
    enabled: !!uuid,
  });

/**
 * Query options for fetching role members
 */
export const roleMembersQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['role-members', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).members.get();

      if (response.error) {
        throw new Error('Failed to fetch role members');
      }

      return response.data;
    },
    enabled: !!uuid,
  });