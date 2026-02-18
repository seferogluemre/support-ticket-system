import { AuthenticatedLayout } from '#/components/layout/authenticated-layout';
import { CompanyContextProvider } from '#/context/company-context';
import { api } from '#lib/api.ts';
import { hasPermission } from '#lib/auth';
import type { CompanyResponse, OrganizationMembershipSummary } from '#types/api';
import type { CompanyMembershipInfo } from '#types/router-context';
import { OrganizationType } from '#types/api';
import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Authenticated Route Loader
 * 
 * This loader provides SSR-like data loading for all authenticated routes:
 * - Loads user session and checks authentication
 * - Extracts user's companies from organizationMemberships (fast, cached)
 * - Reads selected company from sessionStorage (tab-specific)
 * - For system admins: fetches company from backend if not in memberships
 * - Provides this data to CompanyContext via route context
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { queryClient } = context;

    // Fetch session data
    const session = await queryClient.ensureQueryData({
      queryKey: ['session'],
      queryFn: () => api.auth.me.get(),
    });

    if (!session.data) {
      throw redirect({ to: '/sign-in' });
    }

    const userData = session.data;

    /**
     * Check if user can view all companies
     * This is determined by having the 'companies:show' permission globally
     * Uses the centralized permission checking system with wildcard support
     */
    const canViewAllCompanies = hasPermission(userData, 'companies:show');

    // Extract user's companies from organizationMemberships (cached, fast!)
    // This is used for CompanyContext in company-scoped routes
    const companies: CompanyMembershipInfo[] = (userData.organizationMemberships || [])
      .filter((m: OrganizationMembershipSummary) => m.organization.type === OrganizationType.COMPANY)
      .map((m: OrganizationMembershipSummary) => ({
        uuid: m.organization.uuid,
        name: m.organization.name,
        logoSrc: m.organization.logoSrc,
        // Add membership metadata for potential use
        _membership: {
          isAdmin: m.isAdmin,
          isOwner: m.isOwner,
          joinedAt: m.joinedAt.toISOString(),
        },
      }));

    // Check for companyUuid in query string (from Control Panel redirect)
    // If present, save to sessionStorage and remove from URL
    let queryCompanyUuid: string | null = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      queryCompanyUuid = urlParams.get('companyUuid');
      
      if (queryCompanyUuid) {
        // Save to sessionStorage
        sessionStorage.setItem('selected-company-uuid', queryCompanyUuid);
        
        // Remove companyUuid from URL without page reload
        urlParams.delete('companyUuid');
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, '', newUrl);
      }
    }

    // Get stored company UUID from sessionStorage (tab-specific)
    // Use query param if just set, otherwise use stored value
    const storedUuid = queryCompanyUuid ??
      (typeof window !== 'undefined' ? sessionStorage.getItem('selected-company-uuid') : null);

    // Try to find stored company, fallback to first company
    let currentCompany: CompanyResponse | CompanyMembershipInfo | null = null;

    // For users with companies:show permission, fetch company list to get total count and first company
    let totalCompanyCount = companies.length;
    let allCompanyList: CompanyResponse[] = [];
    
    if (canViewAllCompanies) {
      // Fetch company list for system admin (single call for both count and data)
      try {
        const companyListResponse = await queryClient.fetchQuery({
          queryKey: ['companies-list', { perPage: 1 }],
          queryFn: () => api.companies.get({ query: { perPage: 1 } }),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        totalCompanyCount = companyListResponse.data?.meta?.total ?? 0;
        allCompanyList = companyListResponse.data?.data ?? [];
      } catch (error) {
        console.warn('Failed to fetch company list:', error);
      }
    }

    if (canViewAllCompanies) {
      // User with companies:show permission: check if there's only one company in the system
      if (totalCompanyCount === 1 && !storedUuid && allCompanyList.length > 0) {
        // Auto-select the only company in the system (already fetched above)
        const singleCompany = allCompanyList[0];
        currentCompany = singleCompany;
        // Store the auto-selected company
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('selected-company-uuid', singleCompany.uuid);
        }
      } else if (storedUuid) {
        // User with companies:show permission has a stored selection, use that
        // Try to find in memberships first
        currentCompany = companies.find((w) => w.uuid === storedUuid) ?? null;

        // If not in memberships, fetch from backend (users with companies:show can access any company)
        if (!currentCompany) {
          try {
            const companyResponse = await queryClient.fetchQuery({
              queryKey: ['company', storedUuid],
              queryFn: () => api.companies({ uuid: storedUuid }).get(),
              staleTime: 5 * 60 * 1000, // 5 minutes
            });
            
            if (companyResponse.data) {
              currentCompany = companyResponse.data;
            }
          } catch (error) {
            // Company not found or access denied, clear storage
            console.warn('Failed to load stored company:', error);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('selected-company-uuid');
            }
          }
        }
      }
      // If totalCompanyCount > 1 and no stored selection, don't auto-select (show dialog)
    } else {
      // Regular user: use stored or first company
      if (storedUuid) {
        currentCompany = companies.find((w) => w.uuid === storedUuid) ?? null;
      }
      if (!currentCompany && companies.length > 0) {
        currentCompany = companies[0];
      }
    }

    return {
      session: userData,
      companies,
      currentCompany,
      totalCompanyCount,
    };
  },
  component: () => (
    <CompanyContextProvider>
      <AuthenticatedLayout />
    </CompanyContextProvider>
  ),
});
