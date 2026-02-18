import { GlobalRoleFormPage } from '#/features/global-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/global-roles/create')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.ROLE_MANAGE_GLOBAL.CREATE_GLOBALS,
    });
  },
  component: CreateGlobalRolePage,
});

function CreateGlobalRolePage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: '/global-roles' });
  };

  const handleCancel = () => {
    navigate({ to: '/global-roles' });
  };

  return <GlobalRoleFormPage mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />;
}