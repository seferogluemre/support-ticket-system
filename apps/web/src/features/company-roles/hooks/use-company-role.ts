import { useQuery } from '@tanstack/react-query';
import { companyRoleQueryOptions } from '../queries/role-queries';

/**
 * Single Company Role Hook
 *
 * Provides methods to fetch a single company role by UUID
 * Uses react-query for caching and state management
 */
export function useCompanyRole(uuid: string) {
  // ====================================================================
  // 📨 GET SINGLE COMPANY ROLE
  // ====================================================================
  const {
    data: companyRole,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyRoleQueryOptions(uuid),
    enabled: !!uuid,
  });

  return {
    // State
    companyRole,
    isLoading,
    error,

    // Actions
    refetch,
  };
}
