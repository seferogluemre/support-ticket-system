import type { Ticket, TicketPriority, TicketStatus } from '@onlyjs/db/client';

export type { TicketStatus, TicketPriority };

export type TicketCreatePayload = {
  subject: string;
  description: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  requesterEmail: string;
  requesterName: string;
  companyUuid: string;
  assignedToId?: string;
};

export type TicketUpdatePayload = Partial<{
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterEmail: string;
  requesterName: string;
  assignedToId: string | null;
}>;

export type TicketWithRelations = Ticket & {
  createdBy?: {
    id: string;
    name: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  company?: {
    id: number;
    uuid: string;
    name: string;
  };
};
