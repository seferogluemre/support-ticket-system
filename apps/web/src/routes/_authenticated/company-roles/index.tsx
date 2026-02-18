import { CompanyRolesIndexPage, companyRolesListQueryOptions } from '#/features/company-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/company-roles/')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: [
        PERMISSIONS.ROLE_VIEW.SHOW_ALL_ORGANIZATIONS,
        PERMISSIONS.ROLE_MANAGE_ORGANIZATION.CREATE_OWN_ORGANIZATION,
      ],
    });
  },
  loader: ({ context }) => {
    const { currentCompany } = context;
    if (!currentCompany) {
      throw new Error('No company selected');
    }
    return context.queryClient.ensureQueryData(
      companyRolesListQueryOptions(currentCompany.uuid)
    );
  },
  component: CompanyRolesIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading company roles...</div>
    </div>
  ),
});