import { useQuery } from '@tanstack/react-query';
import { companyRoleMembersQueryOptions } from '../queries/role-queries';

/**
 * Company Role Members Hook
 *
 * Provides methods to fetch company role members
 * Uses react-query for caching and state management
 */
export function useCompanyRoleMembers(uuid: string) {
  // ====================================================================
  // 👥 GET COMPANY ROLE MEMBERS
  // ====================================================================
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyRoleMembersQueryOptions(uuid),
    enabled: !!uuid,
  });

  return {
    // State
    members,
    isLoading,
    error,

    // Actions
    refetch,
  };
}
