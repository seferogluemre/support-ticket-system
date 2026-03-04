import { AuthenticatedLayout } from '#/components/layout/authenticated-layout';
import { CompanyContextProvider } from '#/context/company-context';
// import { api } from '#lib/api.ts';
// import { hasPermission } from '#lib/auth';
// import type { CompanyResponse, OrganizationMembershipSummary } from '#types/api';
// import type { CompanyMembershipInfo } from '#types/router-context';
// import { OrganizationType } from '#types/api';
import { createFileRoute } from '@tanstack/react-router';

/**
 * ⚠️ TEMPORARY: Auth bypass for frontend development
 * TODO: Restore original beforeLoad when connecting backend
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Mock session data for frontend development
    const mockSession = {
      user: {
        id: 'mock-user-id',
        uuid: 'mock-uuid',
        email: 'admin@example.com',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        image: null,
        role: 'ADMIN',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'mock-session-id',
        token: 'mock-token',
        userId: 'mock-user-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      scope: 'SYSTEM',
      globalPermissions: ['*'],
      organizationMemberships: [],
    };

    const mockCompany = {
      uuid: 'mock-company-uuid',
      name: 'Test Company',
      logoSrc: null,
    };

    return {
      session: mockSession,
      companies: [mockCompany],
      currentCompany: mockCompany,
      totalCompanyCount: 1,
    };
  },
  component: () => (
    <CompanyContextProvider>
      <AuthenticatedLayout />
    </CompanyContextProvider>
  ),
});
