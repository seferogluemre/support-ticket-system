import { useQuery } from '@tanstack/react-query';
import { TicketStatus, type TicketStats } from '../types';
import { getTicketsByCompany } from '../data/mock-tickets';

interface UseTicketStatsOptions {
  companyUuid?: string;
}

function calculateTicketStats(companyUuid?: string): TicketStats {
  const tickets = getTicketsByCompany(companyUuid);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats: TicketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
    solved: tickets.filter((t) => t.status === TicketStatus.SOLVED).length,
    createdToday: tickets.filter((t) => {
      const ticketDate = new Date(t.createdAt);
      ticketDate.setHours(0, 0, 0, 0);
      return ticketDate.getTime() === today.getTime();
    }).length,
    priorityDistribution: {
      low: tickets.filter((t) => t.priority === 'low').length,
      normal: tickets.filter((t) => t.priority === 'normal').length,
      high: tickets.filter((t) => t.priority === 'high').length,
      urgent: tickets.filter((t) => t.priority === 'urgent').length,
    },
  };
  
  return stats;
}

export function useTicketStats(options: UseTicketStatsOptions = {}) {
  const { companyUuid } = options;
  
  return useQuery({
    queryKey: ['ticket-stats', companyUuid],
    queryFn: () => calculateTicketStats(companyUuid),
    staleTime: 30 * 1000, // 30 seconds
  });
}
