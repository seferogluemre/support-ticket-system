import { Badge } from '#/components/ui/badge';
import { UuidDisplay } from '#/components/ui/uuid-display';
import type { AuditLogShowResponse } from '#backend/modules/audit-logs/types';
import { type ColumnDef } from '@tanstack/react-table';

export const auditLogsColumns: ColumnDef<AuditLogShowResponse>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
          <div className="font-medium">{user.name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'actionType',
    header: 'Action',
    cell: ({ row }) => {
      const actionType = row.getValue('actionType') as string;
      const colorMap: Record<string, string> = {
        Create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        Update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        Delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      };
      return (
        <Badge variant="secondary" className={colorMap[actionType] || ''}>
          {actionType}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entityType',
    header: 'Entity Type',
    cell: ({ row }) => {
      const entityType = row.getValue('entityType') as string;
      return (
        <Badge variant="outline">
          {entityType}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entityUuid',
    header: 'Entity UUID',
    cell: ({ row }) => {
      const uuid = row.getValue('entityUuid') as string;
      return <UuidDisplay uuid={uuid} />;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null;
      return description ? (
        <div className="max-w-[200px] truncate" title={description}>
          {description}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
    cell: ({ row }) => {
      const ipAddress = row.getValue('ipAddress') as string | null;
      return ipAddress ? (
        <span className="font-mono text-xs">{ipAddress}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      const date = new Date(createdAt);
      return (
        <div className="flex flex-col">
          <span>{date.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
        </div>
      );
    },
  },
];