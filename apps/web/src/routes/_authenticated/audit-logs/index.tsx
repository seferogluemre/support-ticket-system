import { AuditLogsIndexPage, auditLogsListQueryOptions } from '#/features/audit-logs';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/audit-logs/')({
  beforeLoad: ({ context }) => {
    guards.requirePermission(context, {
      permissions: PERMISSIONS.SYSTEM_ADMINISTRATION.SHOW_LOGS,
    });
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(auditLogsListQueryOptions({ page: 1, perPage: 20 }));
  },
  component: AuditLogsIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading audit logs...</div>
    </div>
  ),
});