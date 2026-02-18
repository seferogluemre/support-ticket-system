import { Badge } from '#/components/ui/badge';
import type { CountryShowResponse } from '#backend/modules/locations/types';
import { type ColumnDef } from '@tanstack/react-table';

export const countryColumns: ColumnDef<CountryShowResponse>[] = [
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
    cell: ({ row }) => {
      const emoji = row.original.emoji;
      const name = row.getValue('name') as string;
      return (
        <div className="flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'iso2',
    header: 'ISO2',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('iso2')}
      </Badge>
    ),
    meta: {
      className: 'w-[80px]',
    },
  },
  {
    accessorKey: 'iso3',
    header: 'ISO3',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('iso3')}
      </Badge>
    ),
    meta: {
      className: 'w-[80px]',
    },
  },
  {
    accessorKey: 'capital',
    header: 'Capital',
    cell: ({ row }) => {
      const capital = row.getValue('capital') as string | null;
      return capital ? (
        <span>{capital}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
    cell: ({ row }) => {
      const currency = row.getValue('currency') as string | null;
      const currencySymbol = row.original.currencySymbol;
      return currency ? (
        <div className="flex items-center gap-1">
          <span>{currency}</span>
          {currencySymbol && (
            <span className="text-muted-foreground">({currencySymbol})</span>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'phonecode',
    header: 'Phone Code',
    cell: ({ row }) => {
      const phonecode = row.getValue('phonecode') as string | null;
      return phonecode ? (
        <span className="font-mono text-sm">+{phonecode}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'tld',
    header: 'TLD',
    cell: ({ row }) => {
      const tld = row.getValue('tld') as string | null;
      return tld ? (
        <span className="font-mono text-sm">{tld}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    meta: {
      className: 'w-[80px]',
    },
  },
];