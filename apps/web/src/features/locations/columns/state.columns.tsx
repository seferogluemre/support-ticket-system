import { Badge } from '#/components/ui/badge';
import type { StateShowResponse } from '#backend/modules/locations/types';
import { type ColumnDef } from '@tanstack/react-table';

export const stateColumns: ColumnDef<StateShowResponse>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue('id')}
      </span>
    ),
    meta: {
      className: 'w-[60px]',
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'countryCode',
    header: 'Country Code',
    cell: ({ row }) => {
      const code = row.getValue('countryCode') as string;
      return (
        <Badge variant="outline" className="font-mono">
          {code}
        </Badge>
      );
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'stateCode',
    header: 'State Code',
    cell: ({ row }) => {
      const code = row.getValue('stateCode') as string | null;
      return code ? (
        <Badge variant="secondary" className="font-mono">
          {code}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string | null;
      return type ? (
        <span className="text-sm capitalize">{type}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'latitude',
    header: 'Latitude',
    cell: ({ row }) => {
      const lat = row.getValue('latitude') as string | null;
      return lat ? (
        <span className="font-mono text-xs">{lat}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'longitude',
    header: 'Longitude',
    cell: ({ row }) => {
      const lng = row.getValue('longitude') as string | null;
      return lng ? (
        <span className="font-mono text-xs">{lng}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[120px]',
    },
  },
];