import { ProjectsPage, projectsListQueryOptions } from '#/features/projects';
import { createFileRoute } from '@tanstack/react-router';

const STORAGE_KEY = 'selected-company-uuid';

export const Route = createFileRoute('/_authenticated/projects/')({
  loader: ({ context }) => {
    // Get current company UUID from sessionStorage (same key used in company-context)
    const companyUuid = typeof window !== 'undefined'
      ? sessionStorage.getItem(STORAGE_KEY) || undefined
      : undefined;

    return context.queryClient.ensureQueryData(
      projectsListQueryOptions({ companyUuid })
    );
  },
  component: ProjectsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading projects...</div>
    </div>
  ),
});
