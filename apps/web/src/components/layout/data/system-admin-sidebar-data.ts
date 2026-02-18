import {
  IconArticle,
  IconBrowserCheck,
  IconBuilding,
  IconChecklist,
  IconFiles,
  IconHelp,
  IconHistory,
  IconLayoutDashboard,
  IconMapPin,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconSettings,
  IconShield,
  IconTool,
  IconUserCog,
  IconUsers,
} from '@tabler/icons-react';
import type { SidebarData } from '../types';

export const systemAdminSidebarData: SidebarData = {
  navGroups: [
    {
      title: 'System Administration',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Companies',
          url: '/companies',
          icon: IconBuilding,
        },
        {
          title: 'Users',
          url: '/users',
          icon: IconUsers,
        },
        {
          title: 'Posts',
          url: '/posts',
          icon: IconArticle,
        },
        {
          title: 'Global Roles',
          url: '/global-roles',
          icon: IconShield,
        },
        {
          title: 'Audit Logs',
          url: '/audit-logs',
          icon: IconHistory,
        },
        {
          title: 'Locations',
          url: '/locations',
          icon: IconMapPin,
        },
        {
          title: 'File Library',
          url: '/file-library',
          icon: IconFiles,
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