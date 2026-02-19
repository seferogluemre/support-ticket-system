import { Elysia } from 'elysia';
import { dtoWithMiddlewares, NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, PERMISSIONS, withPermission } from '../auth';
import {
  ticketAssignDto,
  ticketCreateDto,
  ticketDestroyDto,
  ticketIndexDto,
  ticketShowDto,
  ticketUpdateDto,
} from './dtos';
import { TicketFormatter } from './formatters';
import { TicketsService } from './service';

const app = new Elysia({ prefix: '/tickets', tags: ['Ticket'] })
  .use(auth())
  .get(
    '/',
    async ({ query, user }) => {
      const { data, total } = await TicketsService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: TicketFormatter.response,
      });
    },
    dtoWithMiddlewares(
      ticketIndexDto,
      withPermission(PERMISSIONS.TICKETS.LIST_OWN_COMPANY, PERMISSIONS.TICKETS.LIST_ALL),
    ),
  )
  .get(
    '/:uuid',
    async ({ params }) => {
      const ticket = await TicketsService.show(params.uuid);
      if (!ticket) throw new NotFoundException('Ticket bulunamadı');
      return TicketFormatter.response(ticket);
    },
    dtoWithMiddlewares(
      ticketShowDto,
      withPermission(PERMISSIONS.TICKETS.SHOW_OWN_COMPANY, PERMISSIONS.TICKETS.SHOW_ALL),
    ),
  )
  .post(
    '/',
    async ({ body, user }) => {
      const ticket = await TicketsService.store(body, user.id);
      return TicketFormatter.response(ticket);
    },
    dtoWithMiddlewares(
      ticketCreateDto,
      withPermission(PERMISSIONS.TICKETS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.TICKET,
        getEntityUuid: (ctx) => {
          const response = ctx.response as ReturnType<typeof TicketFormatter.response>;
          return response.uuid;
        },
        getDescription: () => 'Yeni ticket oluşturuldu',
      }),
    ),
  )
  .put(
    '/:uuid',
    async ({ params, body }) => {
      const ticket = await TicketsService.update(params.uuid, body);
      if (!ticket) throw new NotFoundException('Ticket bulunamadı');
      return TicketFormatter.response(ticket);
    },
    dtoWithMiddlewares(
      ticketUpdateDto,
      withPermission(PERMISSIONS.TICKETS.UPDATE_OWN_COMPANY, PERMISSIONS.TICKETS.UPDATE_ALL),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.TICKET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Ticket güncellendi: ${Object.keys(body as object).join(', ')}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      }),
    ),
  )
  .delete(
    '/:uuid',
    async ({ params }) => {
      const ticket = await TicketsService.destroy(params.uuid);
      if (!ticket) throw new NotFoundException('Ticket bulunamadı');
      return { message: 'Ticket başarıyla silindi' };
    },
    dtoWithMiddlewares(
      ticketDestroyDto,
      withPermission(PERMISSIONS.TICKETS.DELETE_OWN_COMPANY, PERMISSIONS.TICKETS.DELETE_ALL),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.TICKET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Ticket silindi',
      }),
    ),
  )
  .put(
    '/:uuid/assign',
    async ({ params, body }) => {
      const ticket = await TicketsService.assign(params.uuid, body.assignedToId);
      if (!ticket) throw new NotFoundException('Ticket bulunamadı');
      return TicketFormatter.response(ticket);
    },
    dtoWithMiddlewares(
      ticketAssignDto,
      withPermission(PERMISSIONS.TICKETS.ASSIGN),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.TICKET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          body.assignedToId ? 'Ticket atandı' : 'Ticket ataması kaldırıldı',
        getMetadata: ({ body }) => ({ assignedToId: body.assignedToId }),
      }),
    ),
  );

export default app;
