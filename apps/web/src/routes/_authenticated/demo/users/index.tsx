import { createFileRoute } from '@tanstack/react-router';
import Users from '#features/demo/users/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/users/')({
  component: Users,
});
