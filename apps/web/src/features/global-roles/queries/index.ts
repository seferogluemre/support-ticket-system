/**
 * Global Roles Query Options
 */

import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { GlobalRole, GlobalRoleFilters, GlobalRoleMember } from '../types';

// =============================================================================
// GLOBAL ROLES LIST QUERY
// =============================================================================

export const globalRolesListQueryOptions = (filters?: GlobalRoleFilters) =>
  queryOptions({
    queryKey: ['global-roles', filters],
    queryFn: async () => {
      const response = await api.auth.roles.get({
        // biome-ignore lint/suspicious/noExplicitAny: Eden API type inference
        query: { scope: 'global', ...filters } as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch global roles');
      }

      return response.data as unknown as GlobalRole[];
    },
  });

// =============================================================================
// SINGLE GLOBAL ROLE QUERY
// =============================================================================

export const globalRoleQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['global-role', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).get();

      if (response.error) {
        throw new Error('Failed to fetch global role');
      }

      return response.data as unknown as GlobalRole;
    },
    enabled: !!uuid,
  });

// =============================================================================
// GLOBAL ROLE MEMBERS QUERY
// =============================================================================

export const globalRoleMembersQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ['global-role-members', uuid],
    queryFn: async () => {
      const response = await api.auth.roles({ uuid }).members.get();

      if (response.error) {
        throw new Error('Failed to fetch global role members');
      }

      return response.data as unknown as GlobalRoleMember[];
    },
    enabled: !!uuid,
  });

// =============================================================================
// GLOBAL PERMISSION GROUPS QUERY
// =============================================================================

export const globalPermissionGroupsQueryOptions = () =>
  queryOptions({
    queryKey: ['global-permission-groups'],
    queryFn: async () => {
      const response = await api.auth.permissions.groups.get({
        // Global scope - no organizationType
        query: {} as any,
      });

      if (response.error) {
        throw new Error('Failed to fetch global permission groups');
      }

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });