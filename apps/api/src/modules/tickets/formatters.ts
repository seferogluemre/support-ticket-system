import { BaseFormatter } from '../../utils/base-formatter';
import type { TicketWithRelations } from './types';

export abstract class TicketFormatter extends BaseFormatter {
  static response(ticket: TicketWithRelations) {
    return {
      id: ticket.id,
      uuid: ticket.uuid,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      requesterEmail: ticket.requesterEmail,
      requesterName: ticket.requesterName,
      companyId: ticket.companyId,
      companyUuid: ticket.companyUuid,
      createdById: ticket.createdById,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      deletedAt: ticket.deletedAt,
      ...(ticket.createdBy && {
        createdBy: {
          id: ticket.createdBy.id,
          name: ticket.createdBy.name,
        },
      }),
      ...(ticket.assignedTo && {
        assignedTo: {
          id: ticket.assignedTo.id,
          name: ticket.assignedTo.name,
        },
      }),
      ...(ticket.company && {
        company: {
          id: ticket.company.id,
          uuid: ticket.company.uuid,
          name: ticket.company.name,
        },
      }),
    };
  }
}
