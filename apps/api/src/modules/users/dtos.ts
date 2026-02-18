import { type ControllerHook, errorResponseDto } from '#utils';
import { numericQueryParam, paginationQueryDto, paginationResponseDto } from '#utils/pagination';
import type { UserWhereInput } from '@onlyjs/db/client/models';
import { Gender, OrganizationType, UserScope } from '@onlyjs/db/enums';
import { __nullable__ } from '@onlyjs/db/prismabox/__nullable__';
import { UserInputUpdate, UserPlain } from '@onlyjs/db/prismabox/User';
import { t } from 'elysia';
import { passwordValidation } from './field-validations';

const recordStatusEnum = t.Union([t.Literal('ACTIVE'), t.Literal('DELETED'), t.Literal('ALL')]);

const statusEnum = t.Union([t.Literal('ACTIVE'), t.Literal('INACTIVE'), t.Literal('ALL')]);

export function getUserFilters(query?: { id?: string; username?: string; email?: string }) {
  if (!query) {
    return [false, [], undefined] as const;
  }

  const filters: UserWhereInput[] = [];
  const { id, email } = query;

  if (id) {
    filters.push({ id });
  }

  if (email) {
    filters.push({ email });
  }

  return [filters.length > 0, filters, undefined] as const;
}

export const userResponseSchema = t.Object({
  id: UserPlain.properties.id,
  email: UserPlain.properties.email,
  name: t.String(),
  firstName: UserPlain.properties.firstName,
  lastName: UserPlain.properties.lastName,
  scope: UserPlain.properties.scope,
  isActive: UserPlain.properties.isActive,
  createdAt: UserPlain.properties.createdAt,
  updatedAt: UserPlain.properties.updatedAt,
  image: UserPlain.properties.image,
  roles: t.Array(
    t.Object({
      uuid: t.String(),
      name: t.String(),
      type: t.String(),
      organizationType: t.Union([t.String(), t.Null()]),
      organizationUuid: t.Union([t.String(), t.Null()]),
    }),
  ),
});

export const userIndexDto = {
  query: t.Composite([
    paginationQueryDto,
    t.Object({
      id: t.Optional(UserPlain.properties.id),
      email: t.Optional(UserPlain.properties.email),
      search: t.Optional(t.String()),
      recordStatus: t.Optional(recordStatusEnum),
      status: t.Optional(statusEnum),
      organizationType: t.Optional(t.Enum(OrganizationType)),
      organizationId: t.Optional(numericQueryParam()),
      roleUuids: t.Optional(t.Array(t.String())),
    }),
  ]),
  response: { 200: paginationResponseDto(userResponseSchema) },
  detail: {
    summary: 'Index',
  },
} satisfies ControllerHook;

export const userShowDto = {
  params: t.Object({
    id: UserPlain.properties.id,
  }),
  query: t.Object({
    recordStatus: t.Optional(recordStatusEnum),
    status: t.Optional(statusEnum),
  }),
  response: {
    200: userResponseSchema,
    404: errorResponseDto[404],
  },
  detail: {
    summary: 'Show',
  },
} satisfies ControllerHook;

export const userUpdateDto = {
  params: t.Object({
    id: UserPlain.properties.id,
  }),
  body: t.Object({
    password: t.Optional(passwordValidation),
    email: t.Optional(UserInputUpdate.properties.email),
    firstName: t.Optional(UserInputUpdate.properties.firstName),
    lastName: t.Optional(UserInputUpdate.properties.lastName),
    isActive: t.Optional(t.Boolean()),
    gender: t.Optional(t.Enum(Gender)),
    imageFile: t.Optional(__nullable__(t.File())),
  }),
  response: {
    200: userResponseSchema,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Update',
  },
} satisfies ControllerHook;

export const userDestroyDto = {
  params: t.Object({
    id: UserPlain.properties.id,
  }),
  response: {
    200: t.Object({
      message: t.String(),
    }),
    404: errorResponseDto[404],
  },
  detail: {
    summary: 'Destroy',
  },
} satisfies ControllerHook;

export const userCreateDto = {
  body: t.Object({
    email: t.String({ minLength: 3, maxLength: 255 }),
    password: t.String({ minLength: 8, maxLength: 32 }),
    firstName: t.String({ minLength: 2, maxLength: 50 }),
    lastName: t.String({ minLength: 2, maxLength: 50 }),
    roleUuids: t.Array(t.String()),
    isActive: t.Optional(t.Boolean()),
    gender: t.Enum(Gender),
    scope: t.Optional(t.Enum(UserScope)),
    imageFile: t.Optional(__nullable__(t.File())),
  }),
  response: {
    200: userResponseSchema,
    409: errorResponseDto[409],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Create',
  },
} satisfies ControllerHook;

export const userCreateResponseDto = userCreateDto.response['200'];
