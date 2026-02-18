import { GlobalRoleFormPage, globalRoleQueryOptions } from '#/features/global-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/global-roles/$uuid')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.ROLE_MANAGE_GLOBAL.UPDATE_GLOBALS,
    });
  },
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(globalRoleQueryOptions(params.uuid));
  },
  component: EditGlobalRolePage,
});

function EditGlobalRolePage() {
  const navigate = useNavigate();
  const { uuid } = Route.useParams();

  const handleSuccess = () => {
    navigate({ to: '/global-roles' });
  };

  const handleCancel = () => {
    navigate({ to: '/global-roles' });
  };

  return (
    <GlobalRoleFormPage
      mode="edit"
      roleUuid={uuid}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}