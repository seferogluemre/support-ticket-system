import { LocationsIndexPage, countriesListQueryOptions } from '#/features/locations';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/locations/')({
  loader: ({ context }) => {
    // Pre-fetch countries data for the default tab
    return context.queryClient.ensureQueryData(countriesListQueryOptions({ page: 1, perPage: 20 }));
  },
  component: LocationsIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading locations...</div>
    </div>
  ),
});