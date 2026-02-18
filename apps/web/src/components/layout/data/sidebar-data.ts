import {
  IconBrowserCheck,
  IconChecklist,
  IconHelp,
  IconLayoutDashboard,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUsers,
} from '@tabler/icons-react';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';
import { type SidebarData } from '../types';

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
      ],
    },
    {
      title: 'DEMO',
      items: [
        {
          title: 'Tasks',
          url: '/demo/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Apps',
          url: '/demo/apps',
          icon: IconPackages,
        },
        {
          title: 'Chats',
          url: '/demo/chats',
          badge: '3',
          icon: IconMessages,
        },
        {
          title: 'Users',
          url: '/demo/users',
          icon: IconUsers,
        },
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/demo/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/demo/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/demo/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/demo/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/demo/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/demo/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
};
