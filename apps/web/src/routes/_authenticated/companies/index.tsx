import { CompaniesIndexPage, companiesListQueryOptions } from '#/features/companies';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/companies/')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(companiesListQueryOptions());
  },
  component: CompaniesIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading companies...</div>
    </div>
  ),
});
