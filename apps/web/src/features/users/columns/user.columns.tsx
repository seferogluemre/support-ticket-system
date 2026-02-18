import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import type { UserShowResponse } from '#backend/modules/users/types';
import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';

export const usersColumns: ColumnDef<UserShowResponse>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          {user.image && (
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue('email')}</div>;
    },
  },
  {
    accessorKey: 'scope',
    header: 'Scope',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as string;
      return (
        <Badge
          variant="outline"
          className={
            scope === 'SYSTEM'
              ? 'border-purple-500 text-purple-700 dark:text-purple-400'
              : 'border-blue-500 text-blue-700 dark:text-blue-400'
          }
        >
          {scope}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) => {
      const roles = row.original.roles || [];
      if (roles.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 2).map((role: { uuid: string; name: string }) => (
            <Badge key={role.uuid} variant="secondary" className="text-xs">
              {role.name}
            </Badge>
          ))}
          {roles.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{roles.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return (
        <Badge
          className={
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
          }
          variant="secondary"
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return new Date(createdAt).toLocaleDateString();
    },
  },
  {
    id: 'actions',
    header: 'Operations',
    cell: () => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];