import { Badge } from '#/components/ui/badge';
import { cn } from '#/lib/utils';
import { TicketPriority } from '../types';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig = {
  [TicketPriority.LOW]: {
    label: 'Düşük',
    className: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  },
  [TicketPriority.NORMAL]: {
    label: 'Normal',
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
  [TicketPriority.HIGH]: {
    label: 'Yüksek',
    className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  },
  [TicketPriority.URGENT]: {
    label: 'Acil',
    className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  },
};

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
