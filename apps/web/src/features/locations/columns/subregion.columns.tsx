import type { SubregionShowResponse } from '#backend/modules/locations/types';
import { type ColumnDef } from '@tanstack/react-table';

export const subregionColumns: ColumnDef<SubregionShowResponse>[] = [
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
    accessorKey: 'regionId',
    header: 'Region ID',
    cell: ({ row }) => {
      const regionId = row.getValue('regionId') as number;
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {regionId}
        </span>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'wikiDataId',
    header: 'WikiData ID',
    cell: ({ row }) => {
      const wikiId = row.getValue('wikiDataId') as string | null;
      return wikiId ? (
        <span className="font-mono text-xs text-muted-foreground">{wikiId}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[150px]',
    },
  },
];