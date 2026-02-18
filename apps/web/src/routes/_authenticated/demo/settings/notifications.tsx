import { createFileRoute } from '@tanstack/react-router';
import SettingsNotifications from '#features/demo/settings/notifications/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/settings/notifications')({
  component: SettingsNotifications,
});
