import { type ControllerHook, uuidValidation } from '#utils';
import { UserPermissionPlain } from '@onlyjs/db/prismabox/UserPermission';
import { t } from 'elysia';
import { PERMISSION_KEYS } from '../permissions/constants';

/**
 * GET /users/:uuid/permissions - Get all permissions (global + org-specific)
 */
export const getUserPermissionsDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  detail: {
    summary: "Get user's all permissions",
    description: 'Returns all permissions (from roles + direct)',
  },
} satisfies ControllerHook;

/**
 * GET /users/:uuid/permissions/direct - List direct permissions only
 * ✅ Reuses Prismabox fields via t.Pick
 */
export const listDirectPermissionsDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: {
    200: t.Array(
      t.Composite([
        t.Pick(UserPermissionPlain, ['permissionCode', 'organizationType', 'createdAt']),
        t.Object({
          organizationUuid: t.Union([t.String(), t.Null()]), // Custom field (UUID instead of ID)
        }),
      ]),
    ),
  },
  detail: {
    summary: "Get user's direct permissions",
    description: 'Returns only directly assigned permissions (not from roles)',
  },
} satisfies ControllerHook;

/**
 * POST /users/:uuid/permissions - Add direct permission
 * ✅ Reuses Prismabox field via t.Pick
 */
export const addPermissionDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Composite([
    t.Pick(UserPermissionPlain, ['organizationType']),
    t.Object({
      permissionCode: t.Union(PERMISSION_KEYS.map((key) => t.Literal(key))),
      organizationUuid: t.Optional(t.Union([uuidValidation, t.Null()])),
    }),
  ]),
  detail: {
    summary: 'Add direct permission to user',
    description: 'Adds a permission directly to the user (bypassing roles)',
  },
} satisfies ControllerHook;

/**
 * DELETE /users/:uuid/permissions/:permissionCode - Remove direct permission
 * ✅ Reuses Prismabox field via t.Pick
 */
export const removePermissionDto = {
  params: t.Composite([
    t.Object({ uuid: uuidValidation }),
    t.Pick(UserPermissionPlain, ['permissionCode']),
  ]),
  query: t.Composite([
    t.Pick(UserPermissionPlain, ['organizationType']),
    t.Object({
      organizationUuid: t.Optional(t.Union([uuidValidation, t.Null()])),
    }),
  ]),
  detail: {
    summary: 'Remove direct permission from user',
    description: 'Removes a directly assigned permission from the user',
  },
} satisfies ControllerHook;
