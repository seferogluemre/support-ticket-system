import { ProjectEditPage, projectQueryOptions } from '#/features/projects';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/projects/$uuid')({
  loader: ({ context, params: { uuid } }) => {
    return context.queryClient.ensureQueryData(projectQueryOptions(uuid));
  },
  component: ProjectEditPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading project...</div>
    </div>
  ),
});
