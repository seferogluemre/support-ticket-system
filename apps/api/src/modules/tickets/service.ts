import prisma from '@onlyjs/db';
import { Prisma, TicketPriority, TicketStatus } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { NotFoundException } from '../../utils';
import type { PaginationQuery } from '../../utils/pagination';
import type { TicketCreatePayload, TicketUpdatePayload } from './types';

export abstract class TicketsService {
  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Ticket bulunamadı');
      }
    }
    console.error(`Error in TicketsService.${context}:`, error);
    throw error;
  }

  static async index(
    query: PaginationQuery & {
      search?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      companyUuid?: string;
    },
  ) {
    try {
      const { page = 1, perPage = 20, search, status, priority, companyUuid } = query;
      const skip = (page - 1) * perPage;

      const where: Prisma.TicketWhereInput = {
        deletedAt: null,
        ...(companyUuid && { companyUuid }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(search && {
          OR: [
            {
              subject: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              requesterEmail: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              requesterName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            company: {
              select: {
                id: true,
                uuid: true,
                name: true,
              },
            },
          },
        }),
        prisma.ticket.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { uuid, deletedAt: null },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket bulunamadı');
      }

      return ticket;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async store(data: TicketCreatePayload, createdById: string) {
    try {
      const company = await prisma.company.findUnique({
        where: { uuid: data.companyUuid, deletedAt: null },
        select: { id: true, uuid: true },
      });

      if (!company) {
        throw new NotFoundException('Company bulunamadı');
      }

      return await prisma.ticket.create({
        data: {
          subject: data.subject,
          description: data.description,
          status: data.status || TicketStatus.OPEN,
          priority: data.priority || TicketPriority.NORMAL,
          requesterEmail: data.requesterEmail,
          requesterName: data.requesterName,
          companyId: company.id,
          companyUuid: company.uuid,
          createdById,
          ...(data.assignedToId && { assignedToId: data.assignedToId }),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async update(uuid: string, data: TicketUpdatePayload) {
    try {
      const ticket = await prisma.ticket.update({
        where: { uuid, deletedAt: null },
        data,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket bulunamadı');
      }

      return ticket;
    } catch (error) {
      throw this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string) {
    try {
      const ticket = await prisma.ticket.update({
        where: { uuid, deletedAt: null },
        data: { deletedAt: new Date() },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket bulunamadı');
      }

      return ticket;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }

  static async assign(uuid: string, assignedToId: string | null) {
    try {
      if (assignedToId) {
        const user = await prisma.user.findUnique({
          where: { id: assignedToId, deletedAt: null },
          select: { id: true },
        });

        if (!user) {
          throw new NotFoundException('Kullanıcı bulunamadı');
        }
      }

      const ticket = await prisma.ticket.update({
        where: { uuid, deletedAt: null },
        data: { assignedToId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket bulunamadı');
      }

      return ticket;
    } catch (error) {
      throw this.handlePrismaError(error, 'update');
    }
  }
}
