import { useQuery } from '@tanstack/react-query';
import { companyMemberQueryOptions } from '../queries/company-member-queries';

/**
 * Single Company Member Hook
 *
 * Provides methods to fetch a single company member
 * Uses react-query for caching and state management
 */
export function useCompanyMember(companyUuid: string, userId: string) {
  // ====================================================================
  // 📨 GET SINGLE COMPANY MEMBER
  // ====================================================================
  const {
    data: member,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyMemberQueryOptions(companyUuid, userId),
    enabled: !!companyUuid && !!userId,
  });

  return {
    // State
    member,
    isLoading,
    error,

    // Actions
    refetch,
  };
}