import { PostsIndexPage, postsListQueryOptions } from '#/features/posts';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/posts/')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: PERMISSIONS.POSTS.SHOW,
      checkInAnyCompany: true,
    });
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(postsListQueryOptions());
  },
  component: PostsIndexPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading posts...</div>
    </div>
  ),
});