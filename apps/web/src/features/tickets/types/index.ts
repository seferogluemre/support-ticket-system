export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  SOLVED = 'solved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Ticket {
  id: number;
  uuid: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterEmail: string;
  requesterName: string;
  companyUuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketStats {
  total: number;
  open: number;
  solved: number;
  createdToday: number;
  priorityDistribution: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
}
