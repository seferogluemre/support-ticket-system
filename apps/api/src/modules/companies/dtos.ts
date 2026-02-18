import { type ControllerHook, errorResponseDto, uuidValidation } from '#utils';
import { paginationQueryDto, paginationResponseDto } from '#utils/pagination';
import { Gender } from '@onlyjs/db/enums';
import { CompanyPlain, CompanyPlainInputCreate, CompanyPlainInputUpdate } from '@onlyjs/db/prismabox/Company';
import { t } from 'elysia';

// Extended response DTO with owner information
export const companyResponseDto = t.Composite([
  CompanyPlain,
  t.Object({
    owner: t.Optional(
      t.Object({
        uuid: t.String(),
        email: t.String(),
        firstName: t.String(),
        lastName: t.String(),
        name: t.String(),
        image: t.Nullable(t.String()),
      }),
    ),
  }),
]);

// Option 1: Use existing user as owner
const companyCreateWithExistingOwner = t.Composite([
  t.Omit(CompanyPlainInputCreate, ['logoFileSrc', 'name', 'membersCount', 'deletedAt']),
  t.Object({
    name: t.String({ minLength: 1, maxLength: 255 }),
    logoFileId: t.Optional(t.String()),
    ownerUserId: t.String({
      description: 'Existing user UUID to set as company owner',
    }),
  }),
]);

// Option 2: Create new owner user
const companyCreateWithNewOwner = t.Composite([
  t.Omit(CompanyPlainInputCreate, ['logoFileSrc', 'name', 'membersCount', 'deletedAt']),
  t.Object({
    name: t.String({ minLength: 1, maxLength: 255 }),
    logoFileId: t.Optional(t.String()),
    createOwner: t.Object({
      email: t.String({ minLength: 3, maxLength: 255 }),
      password: t.String({ minLength: 8, maxLength: 32 }),
      firstName: t.String({ minLength: 2, maxLength: 50 }),
      lastName: t.String({ minLength: 2, maxLength: 50 }),
      gender: t.Enum(Gender),
      isActive: t.Optional(t.Boolean()),
    }),
  }),
]);

// Union of both options
export const companyCreatePayload = t.Union([
  companyCreateWithExistingOwner,
  companyCreateWithNewOwner,
]);

// Base update payload (without owner change)
const companyUpdateBase = t.Composite([
  t.Omit(CompanyPlainInputUpdate, ['logoFileSrc', 'name', 'membersCount', 'deletedAt']),
  t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
    logoFileId: t.Optional(t.String()),
  }),
]);

// Update with existing owner
const companyUpdateWithExistingOwner = t.Composite([
  companyUpdateBase,
  t.Object({
    ownerUserId: t.String({
      description: 'Existing user UUID to set as new company owner',
    }),
  }),
]);

// Update with new owner
const companyUpdateWithNewOwner = t.Composite([
  companyUpdateBase,
  t.Object({
    createOwner: t.Object({
      email: t.String({ minLength: 3, maxLength: 255 }),
      password: t.String({ minLength: 8, maxLength: 32 }),
      firstName: t.String({ minLength: 2, maxLength: 50 }),
      lastName: t.String({ minLength: 2, maxLength: 50 }),
      gender: t.Enum(Gender),
      isActive: t.Optional(t.Boolean()),
    }),
  }),
]);

// Union of all update options
export const companyUpdatePayload = t.Union([
  companyUpdateBase,
  companyUpdateWithExistingOwner,
  companyUpdateWithNewOwner,
]);

export const companyIndexDto = {
  query: t.Composite([
    paginationQueryDto,
    t.Object({
      search: t.Optional(t.String()),
      sortBy: t.Optional(t.Union([t.Literal('name'), t.Literal('createdAt'), t.Literal('updatedAt')])),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
    }),
  ]),
  response: { 200: paginationResponseDto(companyResponseDto) },
  detail: {
    summary: 'Index',
  },
} satisfies ControllerHook;

export const companyShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: companyResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: 'Show',
  },
} satisfies ControllerHook;

export const companyCreateDto = {
  body: companyCreatePayload,
  response: {
    200: companyResponseDto,
    400: errorResponseDto[400],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Create Company',
    description:
      'Create a new company. Must provide either ownerUserId (existing user) or createOwner (new user). ' +
      'Owner will automatically be assigned ADMIN role for the company.',
  },
} satisfies ControllerHook;

export const companyUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: companyUpdatePayload,
  response: {
    200: companyResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Update Company',
    description:
      'Update company information. Optionally change owner by providing ownerUserId (existing user) or createOwner (new user). ' +
      'When owner is changed, the new owner will be assigned ADMIN role and added as admin member. Old owner keeps their existing roles.',
  },
} satisfies ControllerHook;

export const companyDestroyDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: {
    200: companyResponseDto,
    404: errorResponseDto[404],
  },
  detail: {
    summary: 'Destroy',
  },
} satisfies ControllerHook;
