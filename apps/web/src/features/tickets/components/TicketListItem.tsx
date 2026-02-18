import { cn } from '#/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Circle } from 'lucide-react';
import type { Ticket } from '../types';
import { TicketStatus } from '../types';

interface TicketListItemProps {
  ticket: Ticket;
}

const statusDotColors = {
  [TicketStatus.OPEN]: 'text-blue-500',
  [TicketStatus.IN_PROGRESS]: 'text-purple-500',
  [TicketStatus.PENDING]: 'text-yellow-500',
  [TicketStatus.SOLVED]: 'text-green-500',
  [TicketStatus.CLOSED]: 'text-gray-500',
};

const statusLabels = {
  [TicketStatus.OPEN]: 'Açık',
  [TicketStatus.IN_PROGRESS]: 'Devam Ediyor',
  [TicketStatus.PENDING]: 'Beklemede',
  [TicketStatus.SOLVED]: 'Çözüldü',
  [TicketStatus.CLOSED]: 'Kapalı',
};

const priorityLabels = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
};

export function TicketListItem({ ticket }: TicketListItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({
      to: '/tickets/$uuid',
      params: { uuid: ticket.uuid },
    });
  };

  const timeAgo = formatDistanceToNow(ticket.createdAt, {
    addSuffix: true,
    locale: tr,
  });

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors',
        'hover:bg-muted/50'
      )}
    >
      {/* Status Dot */}
      <div className="pt-1">
        <Circle
          className={cn('h-3 w-3 fill-current', statusDotColors[ticket.status])}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title */}
        <div className="flex items-start gap-2">
          <h3 className="font-medium text-sm leading-tight group-hover:text-blue-600 transition-colors">
            <span className="font-mono text-muted-foreground">#{ticket.id}</span>
            {' - '}
            <span className="truncate">{ticket.subject}</span>
          </h3>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{priorityLabels[ticket.priority]}</span>
          <span>•</span>
          <span>{statusLabels[ticket.status]}</span>
          <span>•</span>
          <span className="truncate">{ticket.requesterName}</span>
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground">
          {timeAgo}
        </div>
      </div>
    </div>
  );
}
