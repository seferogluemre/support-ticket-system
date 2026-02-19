import { TicketPlain, TicketPlainInputCreate, TicketPlainInputUpdate } from '@onlyjs/db/prismabox/Ticket';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

export const ticketResponseDto = t.Composite([
  TicketPlain,
  t.Object({
    createdBy: t.Optional(t.Union([
      t.Object({
        id: t.String(),
        name: t.String(),
      }),
      t.Null(),
    ])),
    assignedTo: t.Optional(t.Union([
      t.Object({
        id: t.String(),
        name: t.String(),
      }),
      t.Null(),
    ])),
    company: t.Optional(t.Object({
      id: t.Number(),
      uuid: t.String(),
      name: t.String(),
    })),
  }),
]);

export const ticketIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    search: t.Optional(t.String()),
    status: t.Optional(t.String()),
    priority: t.Optional(t.String()),
    companyUuid: t.Optional(t.String()),
  }),
  response: {
    200: paginationResponseDto(ticketResponseDto),
  },
  detail: {
    summary: 'Index',
    description: 'Ticketların listesini döndürür',
  },
} satisfies ControllerHook;

export const ticketCreateDto = {
  body: t.Composite([
    TicketPlainInputCreate,
    t.Object({
      companyUuid: uuidValidation,
      assignedToId: t.Optional(t.String()),
    }),
  ]),
  response: { 200: ticketResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: 'Create',
    description: 'Yeni ticket oluşturur',
  },
} satisfies ControllerHook;

export const ticketUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: TicketPlainInputUpdate,
  response: { 200: ticketResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Update',
    description: 'Ticketı günceller',
  },
} satisfies ControllerHook;

export const ticketShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: ticketResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: 'Show',
    description: 'Ticket detaylarını döndürür',
  },
} satisfies ControllerHook;

export const ticketDestroyDto = {
  ...ticketShowDto,
  response: { 200: t.Object({ message: t.String() }), 404: errorResponseDto[404] },
  detail: {
    summary: 'Destroy',
    description: 'Ticketı siler',
  },
} satisfies ControllerHook;

export const ticketAssignDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Object({
    assignedToId: t.Union([t.String(), t.Null()]),
  }),
  response: { 200: ticketResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Assign',
    description: 'Ticketı bir agenta atar veya atamasını kaldırır',
  },
} satisfies ControllerHook;
