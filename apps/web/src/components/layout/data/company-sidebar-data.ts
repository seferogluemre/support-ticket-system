import {
  IconArticle,
  IconBriefcase,
  IconLayoutDashboard,
  IconUserCog,
  IconUsers,
} from '@tabler/icons-react';
import type { SidebarData } from '../types';

export const companySidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Company Management',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Company Members',
          url: '/company-members',
          icon: IconUsers,
        },
        {
          title: 'Company Roles',
          url: '/company-roles',
          icon: IconUserCog,
        },
        {
          title: 'Projects',
          url: '/projects',
          icon: IconBriefcase,
        },
        {
          title: 'Posts',
          url: '/posts',
          icon: IconArticle,
        },
      ],
    },
  ],
};