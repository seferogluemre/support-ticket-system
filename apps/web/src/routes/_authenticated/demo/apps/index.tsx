import { createFileRoute } from '@tanstack/react-router';
import Apps from '#features/demo/apps/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/apps/')({
  component: Apps,
});
