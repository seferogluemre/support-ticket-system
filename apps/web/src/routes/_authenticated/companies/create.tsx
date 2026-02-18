import { CompanyCreatePage } from '#/features/companies';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/companies/create')({
  component: CompanyCreatePage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
});
