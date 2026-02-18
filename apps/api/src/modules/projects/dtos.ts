import { ProjectPlain, ProjectPlainInputCreate, ProjectPlainInputUpdate } from '@onlyjs/db/prismabox/Project';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

// Project response DTO - omit internal IDs, keep UUIDs and userIds
export const projectResponseDto = t.Composite([
  t.Omit(ProjectPlain, ['id', 'companyId']),
  t.Object({
    company: t.Object({
      uuid: t.String(),
      name: t.String(),
    }),
    createdBy: t.Object({
      id: t.String(),
      name: t.String(),
    }),
  }),
]);

// Index DTO
export const projectIndexDto = {
  query: t.Composite([
    paginationQueryDto,
    t.Object({
      search: t.Optional(t.String()),
      companyUuid: t.Optional(t.String()),
      status: t.Optional(ProjectPlain.properties.status),
    }),
  ]),
  response: {
    200: paginationResponseDto(projectResponseDto),
  },
  detail: {
    summary: 'List Projects',
    description: 'Projelerin listesini döndürür. projects:list-all permission\'ı olanlar tüm projeleri, projects:list-own-company permission\'ı olanlar sadece üye oldukları company projelerini görebilir.',
    tags: ['Projects'],
  },
} satisfies ControllerHook;

// Show DTO
export const projectShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: projectResponseDto, 404: errorResponseDto[404], 403: errorResponseDto[403] },
  detail: {
    summary: 'Show Project',
    description: 'Proje detaylarını döndürür',
    tags: ['Projects'],
  },
} satisfies ControllerHook;

// Create DTO
export const projectCreateDto = {
  body: t.Composite([
    ProjectPlainInputCreate,
    t.Object({
      companyUuid: t.String(),
    }),
  ]),
  response: { 
    200: projectResponseDto, 
    404: errorResponseDto[404],
    403: errorResponseDto[403],
    422: errorResponseDto[422] 
  },
  detail: {
    summary: 'Create Project',
    description: 'Yeni proje oluşturur. projects:create permission\'ı gerekir (company scope).',
    tags: ['Projects'],
  },
} satisfies ControllerHook;

// Update DTO
export const projectUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: ProjectPlainInputUpdate,
  response: { 
    200: projectResponseDto, 
    404: errorResponseDto[404],
    403: errorResponseDto[403],
    422: errorResponseDto[422] 
  },
  detail: {
    summary: 'Update Project',
    description: 'Projeyi günceller. projects:update-all (global) veya projects:update-own-company (company scope) permission\'ı gerekir.',
    tags: ['Projects'],
  },
} satisfies ControllerHook;

// Delete DTO
export const projectDestroyDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 
    200: t.Object({ message: t.String() }), 
    404: errorResponseDto[404],
    403: errorResponseDto[403],
  },
  detail: {
    summary: 'Delete Project',
    description: 'Projeyi siler (soft delete). projects:delete-all (global) veya projects:delete-own-company (company scope) permission\'ı gerekir.',
    tags: ['Projects'],
  },
} satisfies ControllerHook;