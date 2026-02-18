/**
 * Global Roles Hook
 * Provides query functions for fetching global roles and their members
 */

import { useQuery } from '@tanstack/react-query';
import {
  globalPermissionGroupsQueryOptions,
  globalRoleMembersQueryOptions,
  globalRoleQueryOptions,
  globalRolesListQueryOptions,
} from '../queries';
import type { GlobalRoleFilters } from '../types';

/**
 * Hook for fetching global roles list
 */
export function useGlobalRoles(filters?: GlobalRoleFilters) {
  const query = useQuery(globalRolesListQueryOptions(filters));

  return {
    globalRoles: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching a single global role
 */
export function useGlobalRole(uuid: string) {
  const query = useQuery(globalRoleQueryOptions(uuid));

  return {
    globalRole: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching global role members
 */
export function useGlobalRoleMembers(uuid: string) {
  const query = useQuery({
    ...globalRoleMembersQueryOptions(uuid),
    enabled: !!uuid,
  });

  return {
    members: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching global permission groups
 */
export function useGlobalPermissionGroups() {
  const query = useQuery(globalPermissionGroupsQueryOptions());

  return {
    permissionGroups: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}