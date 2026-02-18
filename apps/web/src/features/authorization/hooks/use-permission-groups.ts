/**
 * usePermissionGroups Hook
 * Hook for fetching permission groups
 */

import type { OrganizationType } from '#/types/api';
import { useQuery } from '@tanstack/react-query';
import { permissionGroupsQueryOptions } from '../queries';
import type { PermissionGroupMap } from '../types';

export interface UsePermissionGroupsOptions {
  organizationType?: OrganizationType | null;
  enabled?: boolean;
}

/**
 * Hook for fetching permission groups (grouped by category)
 * @param options - Query options
 */
export function usePermissionGroups(options: UsePermissionGroupsOptions = {}) {
  const { organizationType, enabled = true } = options;

  const query = useQuery({
    ...permissionGroupsQueryOptions(organizationType),
    enabled,
  });

  return {
    permissionGroups: query.data as PermissionGroupMap | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Helper function to count selected permissions in a group
 */
export function countSelectedInGroup(
  groupKey: string,
  groupPermissions: { key: string }[],
  selectedPermissions: string[],
): { selected: number; total: number; hasWildcard: boolean; hasGroupWildcard: boolean } {
  const hasWildcard = selectedPermissions.includes('*');
  const hasGroupWildcard = selectedPermissions.includes(`${groupKey}:*`);
  
  if (hasWildcard || hasGroupWildcard) {
    return {
      selected: groupPermissions.length,
      total: groupPermissions.length,
      hasWildcard,
      hasGroupWildcard,
    };
  }

  const selected = groupPermissions.filter((p) => selectedPermissions.includes(p.key)).length;

  return {
    selected,
    total: groupPermissions.length,
    hasWildcard,
    hasGroupWildcard,
  };
}

/**
 * Helper function to check if a permission matches a wildcard pattern
 */
export function matchesWildcard(permissionKey: string, wildcardPattern: string): boolean {
  if (wildcardPattern === '*') return true;
  if (wildcardPattern === permissionKey) return true;
  
  if (wildcardPattern.endsWith(':*')) {
    const prefix = wildcardPattern.slice(0, -1); // Remove "*" (keep ":")
    return permissionKey.startsWith(prefix);
  }
  
  return false;
}

/**
 * Helper function to check if a permission is selected (considering wildcards)
 */
export function isPermissionSelected(
  permissionKey: string,
  selectedPermissions: string[],
): boolean {
  return selectedPermissions.some((selected) => matchesWildcard(permissionKey, selected));
}