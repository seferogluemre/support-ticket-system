import { createFileRoute } from '@tanstack/react-router';
import Tasks from '#features/demo/tasks/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/tasks/')({
  component: Tasks,
});
