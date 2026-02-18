import { CompanyEditPage, companyQueryOptions } from '#/features/companies';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/companies/$uuid')({
  loader: ({ context, params: { uuid } }) => {
    return context.queryClient.ensureQueryData(companyQueryOptions(uuid));
  },
  component: CompanyEditPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading company...</div>
    </div>
  ),
});
