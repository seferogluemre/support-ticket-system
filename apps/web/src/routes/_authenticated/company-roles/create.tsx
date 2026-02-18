import { CompanyRoleCreatePage } from '#/features/company-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/company-roles/create')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: PERMISSIONS.ROLE_MANAGE_ORGANIZATION.CREATE_OWN_ORGANIZATION,
    });
  },
  component: CompanyRoleCreatePage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
});