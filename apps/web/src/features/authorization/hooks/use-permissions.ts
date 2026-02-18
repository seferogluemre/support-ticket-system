/**
 * usePermissions Hook
 * Hook for fetching permission list
 */

import type { OrganizationType } from '#/types/api';
import { useQuery } from '@tanstack/react-query';
import { permissionsQueryOptions } from '../queries';

export interface UsePermissionsOptions {
  organizationType?: OrganizationType | null;
  enabled?: boolean;
}

/**
 * Hook for fetching permissions list
 * @param options - Query options
 */
export function usePermissions(options: UsePermissionsOptions = {}) {
  const { organizationType, enabled = true } = options;

  const query = useQuery({
    ...permissionsQueryOptions(organizationType),
    enabled,
  });

  return {
    permissions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}