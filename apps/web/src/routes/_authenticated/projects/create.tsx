import { ProjectCreatePage } from '#/features/projects';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/projects/create')({
  component: ProjectCreatePage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
});
