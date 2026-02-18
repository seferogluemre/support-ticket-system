import { Button } from '#/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import type { Ticket } from '../types';
import { TicketListItem } from './TicketListItem';

interface TicketsListProps {
  tickets: Ticket[];
  isLoading?: boolean;
  showViewAll?: boolean;
}

export function TicketsList({ tickets, isLoading, showViewAll = false }: TicketsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Henüz ticket bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="divide-y">
        {tickets.map((ticket) => (
          <TicketListItem key={ticket.uuid} ticket={ticket} />
        ))}
      </div>
      
      {showViewAll && (
        <div className="p-4 border-t bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/tickets' })}
            className="w-full"
          >
            Tümünü Gör
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
