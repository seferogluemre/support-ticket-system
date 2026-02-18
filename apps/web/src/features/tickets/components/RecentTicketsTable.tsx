import { Button } from '#/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import type { Ticket } from '../types';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketStatusBadge } from './TicketStatusBadge';

interface RecentTicketsTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

export function RecentTicketsTable({ tickets, isLoading }: RecentTicketsTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Henüz ticket bulunmuyor.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Konu</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Öncelik</TableHead>
          <TableHead>Talep Eden</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.uuid}>
            <TableCell className="font-mono text-sm font-medium">
              #{ticket.id}
            </TableCell>
            <TableCell className="font-medium max-w-[300px] truncate">
              {ticket.subject}
            </TableCell>
            <TableCell>
              <TicketStatusBadge status={ticket.status} />
            </TableCell>
            <TableCell>
              <TicketPriorityBadge priority={ticket.priority} />
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {ticket.requesterName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(ticket.createdAt, 'dd.MM.yyyy HH:mm')}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate({
                    to: '/tickets/$uuid',
                    params: { uuid: ticket.uuid },
                  })
                }
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
