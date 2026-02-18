import { createFileRoute } from '@tanstack/react-router';
import SettingsProfile from '#features/demo/settings/profile/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/settings/')({
  component: SettingsProfile,
});
