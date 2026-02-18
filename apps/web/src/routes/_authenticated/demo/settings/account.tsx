import { createFileRoute } from '@tanstack/react-router';
import SettingsAccount from '#features/demo/settings/account/index.tsx';

export const Route = createFileRoute('/_authenticated/demo/settings/account')({
  component: SettingsAccount,
});
