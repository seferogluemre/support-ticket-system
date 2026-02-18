import { Badge } from '#/components/ui/badge';
import { cn } from '#/lib/utils';
import { TicketStatus } from '../types';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig = {
  [TicketStatus.OPEN]: {
    label: 'Açık',
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
  [TicketStatus.IN_PROGRESS]: {
    label: 'Devam Ediyor',
    className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  },
  [TicketStatus.PENDING]: {
    label: 'Beklemede',
    className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  },
  [TicketStatus.SOLVED]: {
    label: 'Çözüldü',
    className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  },
  [TicketStatus.CLOSED]: {
    label: 'Kapalı',
    className: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  },
};

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
