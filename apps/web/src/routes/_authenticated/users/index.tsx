import { UsersIndexPage, usersListQueryOptions } from '#/features/users';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/users/')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(usersListQueryOptions({ page: 1, perPage: 20 }));
  },
  component: UsersIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading users...</div>
    </div>
  ),
});