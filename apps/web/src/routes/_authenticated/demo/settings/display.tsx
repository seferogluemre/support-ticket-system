import { createFileRoute } from '@tanstack/react-router';
import SettingsDisplay from '#features/demo/settings/display/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/settings/display')({
  component: SettingsDisplay,
});
