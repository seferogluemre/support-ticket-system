import { CompanyRoleEditPage, companyRoleQueryOptions } from '#/features/company-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/company-roles/$uuid')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: [
        PERMISSIONS.ROLE_VIEW.SHOW_ALL_ORGANIZATIONS,
        PERMISSIONS.ROLE_MANAGE_ORGANIZATION.UPDATE_OWN_ORGANIZATION,
      ],
    });
  },
  loader: ({ context, params: { uuid } }) => {
    return context.queryClient.ensureQueryData(companyRoleQueryOptions(uuid));
  },
  component: CompanyRoleEditPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading company role...</div>
    </div>
  ),
});