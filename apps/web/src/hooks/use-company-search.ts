import { useDebounce } from '#/hooks/use-debounce';
import { useSession } from '#/hooks/use-session';
import { hasSystemScope } from '#/lib/auth';
import { api } from '#/lib/api';
import type { CompanyResponse } from '#/types/api';
import { useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useMemo } from 'react';

interface UseCompanySearchProps {
  search: string;
  enabled?: boolean;
}

interface UseCompanySearchReturn {
  companies: CompanyResponse[];
  isLoading: boolean;
  hasSystemScope: boolean;
}

/**
 * Shared hook for company search logic
 *
 * - System Scope: Backend search (max 5 results)
 * - Company Scope: Frontend search (from organizationMemberships)
 */
export function useCompanySearch({
  search,
  enabled = true,
}: UseCompanySearchProps): UseCompanySearchReturn {
  const routerContext = useRouteContext({ strict: false });
  const debouncedSearch = useDebounce(search, 300);
  const { session } = useSession();
  
  const userHasSystemScope = hasSystemScope(session);

  const { companies: membershipCompanies } = routerContext as {
    companies?: CompanyResponse[];
  };

  // System Scope: Backend search (always enabled, even with empty search)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['companies-search', debouncedSearch],
    queryFn: () =>
      api.companies.get({
        query: {
          search: debouncedSearch || undefined,
          perPage: 5, // System scope: max 5 results
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      }),
    enabled: enabled && userHasSystemScope, // Always enabled for system scope (no search check)
  });

  // Display logic based on user scope
  const companies = useMemo(() => {
    if (userHasSystemScope) {
      // System scope: always show backend results (even when not searching)
      return searchResults?.data?.data || [];
    }

    // Company scope: filter membership companies (frontend search)
    if (!debouncedSearch) {
      return membershipCompanies || [];
    }

    const searchLower = debouncedSearch.toLowerCase();
    return (membershipCompanies || []).filter((company) =>
      company.name.toLowerCase().includes(searchLower),
    );
  }, [userHasSystemScope, debouncedSearch, searchResults, membershipCompanies]);

  return {
    companies,
    isLoading: userHasSystemScope ? isSearching : false,
    hasSystemScope: userHasSystemScope,
  };
}