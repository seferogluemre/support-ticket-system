import { PostCreatePage } from '#/features/posts';
import { PERMISSIONS } from '#/lib/auth';
import { guards } from '#/lib/router/guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/posts/create')({
  beforeLoad: ({ context }) => {
    guards.requireCompanyPermission(context, {
      permissions: PERMISSIONS.POSTS.CREATE,
      checkInAnyCompany: true,
    });
  },
  component: PostCreatePage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
});