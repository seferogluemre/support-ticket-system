import { GlobalRolesIndexPage, globalRolesListQueryOptions } from '#/features/global-roles';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/global-roles/')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.ROLE_VIEW.LIST_GLOBALS,
    });
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(globalRolesListQueryOptions());
  },
  component: GlobalRolesIndexPage,
  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading global roles...</div>
    </div>
  ),
});
