import { useQuery } from '@tanstack/react-query';
import { companyQueryOptions } from '../queries/company-queries';

/**
 * Single Company Hook
 *
 * Provides methods to fetch a single company
 * Uses react-query for caching and state management
 */
export function useCompany(companyUuid: string) {
  // ====================================================================
  // 📨 GET SINGLE COMPANY
  // ====================================================================
  const {
    data: company,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyQueryOptions(companyUuid),
    enabled: !!companyUuid,
  });

  return {
    // State
    company,
    isLoading,
    error,

    // Actions
    refetch,
  };
}
