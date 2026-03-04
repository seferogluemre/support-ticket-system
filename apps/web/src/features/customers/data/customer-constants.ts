import type { Customer } from '../types';

export const CUSTOMERS: Customer[] = [
    {
        id: '1',
        name: 'Ahmet',
        email: 'ahmet@deneme.com',
        hasAlert: true,
        tags: '-',
        timezone: '(GMT+03:00) Istanbul',
        lastUpdated: 'Monday 22:47',
    },
    {
        id: '2',
        name: 'Customer',
        email: 'example@zendesk.com',
        hasAlert: true,
        tags: '-',
        timezone: '(GMT+03:00) Istanbul',
        lastUpdated: 'Monday 22:33',
    },
    {
        id: '3',
        name: 'Mehmet',
        email: 'test@gmail.com',
        hasAlert: true,
        tags: '-',
        timezone: '(GMT+03:00) Istanbul',
        lastUpdated: 'Feb 16',
    },
    {
        id: '4',
        name: 'Ahmet',
        email: 'ahmet@example.com',
        hasAlert: true,
        tags: '-',
        timezone: '(GMT+03:00) Istanbul',
        lastUpdated: 'Feb 16',
    },
];
