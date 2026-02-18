import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { RoleTypeIndicator } from '#/features/authorization';
import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Settings, Trash2 } from 'lucide-react';
import type { GlobalRole } from '../types';

export const globalRolesColumns: ColumnDef<GlobalRole>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const role = row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">{role.name}</span>
          <RoleTypeIndicator type={role.type} size="sm" />
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue('description')}</div>;
    },
  },
  {
    accessorKey: 'order',
    header: 'Order',
    cell: ({ row }) => {
      const order = row.getValue('order') as number;
      return (
        <Badge variant="outline" className="font-mono text-xs">
          #{order}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    cell: () => {
      return (
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Operations',
    cell: () => {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];