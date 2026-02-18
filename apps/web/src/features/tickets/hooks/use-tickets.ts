import { useQuery } from '@tanstack/react-query';
import type { Ticket } from '../types';
import { getRecentTickets, getTicketsByCompany } from '../data/mock-tickets';

interface UseTicketsOptions {
  companyUuid?: string;
  limit?: number;
  recent?: boolean;
}

export function useTickets(options: UseTicketsOptions = {}) {
  const { companyUuid, limit, recent = false } = options;
  
  return useQuery<Ticket[]>({
    queryKey: ['tickets', companyUuid, limit, recent],
    queryFn: () => {
      if (recent && limit) {
        return getRecentTickets(limit, companyUuid);
      }
      return getTicketsByCompany(companyUuid);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
