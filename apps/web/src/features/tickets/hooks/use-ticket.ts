import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket, TicketPriority, TicketStatus } from '../types';
import { getTicketByUuid } from '../data/mock-tickets';

interface UseTicketOptions {
  uuid: string;
}

interface UpdateTicketParams {
  uuid: string;
  data: {
    status?: TicketStatus;
    priority?: TicketPriority;
    subject?: string;
    description?: string;
  };
}

export function useTicket(options: UseTicketOptions) {
  const { uuid } = options;
  const queryClient = useQueryClient();

  // Fetch single ticket
  const ticketQuery = useQuery<Ticket | undefined>({
    queryKey: ['ticket', uuid],
    queryFn: () => getTicketByUuid(uuid),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update ticket mutation (mock)
  const updateTicketMutation = useMutation({
    mutationFn: async ({ uuid, data }: UpdateTicketParams) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // In a real app, this would call the API
      // For now, we just return the updated data
      return { uuid, ...data };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['ticket', uuid] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast.success('Ticket başarıyla güncellendi');
    },
    onError: () => {
      toast.error('Ticket güncellenirken bir hata oluştu');
    },
  });

  return {
    ticket: ticketQuery.data,
    isLoading: ticketQuery.isLoading,
    isError: ticketQuery.isError,
    updateTicket: updateTicketMutation.mutate,
    isUpdating: updateTicketMutation.isPending,
  };
}
