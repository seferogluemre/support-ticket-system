import { CompanyMembersPage, companyMembersListQueryOptions } from '#/features/company-members';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/company-members/')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: PERMISSIONS.USER_BASIC.LIST,
    });
  },
  loader: ({ context }) => {
    const { currentCompany } = context;
    if (!currentCompany) {
      throw new Error('No company selected');
    }
    return context.queryClient.ensureQueryData(
      companyMembersListQueryOptions(currentCompany.uuid)
    );
  },
  component: CompanyMembersPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading company members...</div>
    </div>
  ),
});