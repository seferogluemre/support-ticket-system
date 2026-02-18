import { PostEditPage, postQueryOptions } from '#/features/posts';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/posts/$uuid')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: [PERMISSIONS.POSTS.SHOW, PERMISSIONS.POSTS.UPDATE],
      checkInAnyCompany: true,
    });
  },
  loader: ({ context, params: { uuid } }) => {
    return context.queryClient.ensureQueryData(postQueryOptions(uuid));
  },
  component: PostEditPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading post...</div>
    </div>
  ),
});