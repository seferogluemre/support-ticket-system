import { type ControllerHook, errorResponseDto, numericQueryParam, prepareFilters, uuidValidation } from '#utils';
import { RolePlain } from '@onlyjs/db/prismabox/Role';
import { UserPlain } from '@onlyjs/db/prismabox/User';
import { t } from 'elysia';
import { OrganizationTypeSchema } from '../organizations/constants';
import { PERMISSION_GROUP_KEYS, PERMISSION_KEYS } from '../permissions/constants';

export const [roleFiltersDto, , filterRoles] = prepareFilters(RolePlain, {
  search: ['name'],
  date: ['createdAt', 'updatedAt'],
});

/**
 * 🔒 Safe Role Response Schema - UUID-based (no numeric IDs)
 * ✅ Reuses Prismabox fields via t.Pick
 */
export const RoleResponseSchema = t.Composite([
  t.Pick(RolePlain, [
    'uuid',
    'name',
    'description',
    'permissions',
    'organizationType',
    'type',
    'order',
    'createdAt',
    'updatedAt',
  ]),
  t.Object({
    organizationUuid: t.Union([t.String(), t.Null()]), // Custom field (not in DB)
    // Member preview (for list view)
    memberCount: t.Optional(t.Number()),
    memberPreview: t.Optional(
      t.Array(
        t.Object({
          uuid: t.String(),
          name: t.String(),
          image: t.Union([t.String(), t.Null()]),
        }),
        { maxItems: 5 },
      ),
    ),
  }),
]);

// Extended filters for role queries
const roleQueryDto = t.Composite([
  t.Omit(roleFiltersDto, ['organizationId', 'organizationType']),
  t.Object({
    // Scope filter: 'global' | 'organization'
    scope: t.Optional(t.Union([t.Literal('global'), t.Literal('organization')])),

    // 🔒 Organization filters
    organizationType: t.Optional(OrganizationTypeSchema),
    organizationUuid: t.Optional(uuidValidation),

    // 🆕 Permission filters
    hasPermission: t.Optional(t.String()), // Filter roles that have specific permission
    hasAnyPermission: t.Optional(t.Array(t.String())), // Filter roles that have any of these permissions
    hasAllPermissions: t.Optional(t.Array(t.String())), // Filter roles that have all of these permissions

    // 🆕 Member count filter
    minMembers: t.Optional(numericQueryParam()), // Roles with at least N members (use minMembers: 1 for hasMembers)
    maxMembers: t.Optional(numericQueryParam()), // Roles with at most N members
  }),
]);

const rolePermissionsDto = t.Union([
  // Global wildcard: ["*"]
  t.Array(t.Literal('*'), {
    minItems: 1,
    maxItems: 1,
    uniqueItems: true,
  }),
  // Specific permissions OR group wildcards: ["users:*", "posts:read", "comments:*"]
  t.Array(
    t.Union([
      // Group wildcards (e.g., "user-basic:*", "posts:*")
      ...PERMISSION_GROUP_KEYS.map((key) => t.Literal(key + ':*')),
      // Specific permissions
      ...PERMISSION_KEYS.map((key) => t.Literal(key)),
    ]),
    {
      uniqueItems: true,
    },
  ),
]);

export const roleIndexDto = {
  query: roleQueryDto,
  response: { 200: t.Array(RoleResponseSchema) }, // ✅ UUID-based response
  detail: {
    summary: 'Index',
    description: 'Get roles - filterable by scope (global/organization) or specific organization',
  },
} satisfies ControllerHook;

export const roleShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: RoleResponseSchema, 404: errorResponseDto[404] }, // ✅ UUID-based response
  detail: {
    summary: 'Show',
    description: 'Get role by UUID',
  },
} satisfies ControllerHook;
export const roleShowResponseDto = roleShowDto.response[200];

export const roleStoreBodyDto = t.Composite([
  t.Pick(RolePlain, ['name', 'uuid', 'description']),
  t.Object({
    permissions: rolePermissionsDto,
    organizationType: t.Optional(OrganizationTypeSchema),
    organizationUuid: t.Optional(uuidValidation),
    order: t.Optional(t.Integer({ minimum: 0, maximum: 1000, default: 0 })),
  }),
]);

// Update body DTO - organizationType and organizationUuid cannot be changed after creation
export const roleUpdateBodyDto = t.Partial(
  t.Composite([
    t.Pick(RolePlain, ['name', 'description']),
    t.Object({
      permissions: rolePermissionsDto,
      order: t.Integer({ minimum: 0, maximum: 1000 }),
    }),
  ]),
);

export const roleStoreDto = {
  body: roleStoreBodyDto,
  response: { 200: RoleResponseSchema, 409: errorResponseDto[409], 422: errorResponseDto[422] }, // ✅ UUID-based response
  detail: {
    summary: 'Store',
  },
} satisfies ControllerHook;

export const roleUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: roleUpdateBodyDto,
  response: { 200: RoleResponseSchema, 404: errorResponseDto[404], 422: errorResponseDto[422] }, // ✅ UUID-based response
  detail: {
    summary: 'Update',
    description: 'Update role by UUID',
  },
} satisfies ControllerHook;

export const roleDestroyDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: t.Object({ message: t.String() }), 404: errorResponseDto[404] },
  detail: {
    summary: 'Destroy',
    description: 'Delete role by UUID',
  },
} satisfies ControllerHook;

// ========================================================================
// 🧑‍🤝‍🧑 Role Member Management DTOs
// ========================================================================

/**
 * GET /:uuid/members - List role members
 * ✅ Reuses Prismabox User fields via t.Pick + custom fields
 */
export const roleGetMembersDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: {
    200: t.Array(
      t.Composite([
        t.Pick(UserPlain, ['email', 'image']),
        t.Object({
          uuid: t.String(), // User.id (which is UUID)
          name: t.String(), // Computed name field
          assignedAt: t.Date(), // UserRole.createdAt
        }),
      ]),
    ),
  },
  detail: {
    summary: 'Get role members',
    description: 'List all users assigned to this role by UUID',
  },
} satisfies ControllerHook;

/**
 * POST /:uuid/members - Assign role to user
 */
export const roleAssignMemberDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Object({
    userId: uuidValidation,
  }),
  detail: {
    summary: 'Assign role to user',
    description: 'Assigns this role to a user by UUID',
  },
} satisfies ControllerHook;

/**
 * DELETE /:uuid/members/:userId - Remove role from user
 */
export const roleRemoveMemberDto = {
  params: t.Object({
    uuid: uuidValidation,
    userId: uuidValidation,
  }),
  detail: {
    summary: 'Remove role from user',
    description: 'Removes this role from a user by UUID',
  },
} satisfies ControllerHook;

/**
 * PUT /:uuid/members/sync - Sync role members (bulk update)
 * Compares current members with provided list and adds/removes as needed
 */
export const roleSyncMembersDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Object({
    userIds: t.Array(uuidValidation, {
      description: 'Array of user UUIDs that should have this role',
    }),
  }),
  response: {
    200: t.Object({
      message: t.String(),
      added: t.Number(),
      removed: t.Number(),
    }),
    403: errorResponseDto[403],
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Sync role members',
    description:
      'Syncs role members by comparing current state with provided list. Adds missing users and removes extras.',
  },
} satisfies ControllerHook;

// ========================================================================
// 🎯 Role Reordering DTO
// ========================================================================

/**
 * PATCH /reorder - Batch reorder roles
 * Updates multiple role orders atomically
 */
export const roleReorderDto = {
  body: t.Object({
    // Array of role updates with new order positions
    roles: t.Array(
      t.Object({
        uuid: uuidValidation,
        order: t.Integer({ minimum: 0, maximum: 1000 }),
      }),
      {
        minItems: 1,
        maxItems: 100, // Prevent abuse
      },
    ),
    // Optional: scope filter (if not provided, assumes global)
    organizationType: t.Optional(OrganizationTypeSchema),
    organizationUuid: t.Optional(uuidValidation),
  }),
  response: {
    200: t.Object({
      message: t.String(),
      updated: t.Number(),
    }),
    403: errorResponseDto[403],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Reorder roles',
    description:
      'Batch update role orders. User can only reorder roles with lower order than their highest role.',
  },
} satisfies ControllerHook;
