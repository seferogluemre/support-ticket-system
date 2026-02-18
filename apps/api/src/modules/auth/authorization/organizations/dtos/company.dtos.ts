import { Gender } from '@onlyjs/db/enums';
import { t } from 'elysia';
import type { ControllerHook } from '../../../../../utils';
import { baseMemberDetailsObjectSchema, baseMemberObjectSchema } from './common.dtos';

/**
 * Company member response schema
 */
export const companyMemberObjectSchema = t.Composite([
  baseMemberObjectSchema,
  // other properties to extend
]);

/**
 * Company member details response schema
 */
export const companyMemberDetailsObjectSchema = t.Composite([
  baseMemberDetailsObjectSchema,
 // other properties to extend
]);

/**
 * GET /organizations/company/:organizationUuid/members
 * List all members of a company organization
 */
export const companyMembersIndexDto = {
  params: t.Object({
    organizationUuid: t.String({
      description: 'Company UUID',
    }),
  }),
  response: {
    200: t.Array(companyMemberObjectSchema),
  },
  detail: {
    summary: 'List Company Members',
    description: 'Returns all members of the company with their roles and admin status',
  },
} satisfies ControllerHook;

/**
 * GET /organizations/company/:organizationUuid/members/:userId
 * Get detailed information about a specific company member
 */
export const companyMembersShowDto = {
  params: t.Object({
    organizationUuid: t.String({
      description: 'Company UUID',
    }),
    userId: t.String({
      description: 'User UUID',
    }),
  }),
  response: {
    200: companyMemberDetailsObjectSchema,
  },
  detail: {
    summary: 'Get Company Member Details',
    description: 'Returns detailed information about a specific company member including all roles and permissions',
  },
} satisfies ControllerHook;

/**
 * POST /organizations/company/:organizationUuid/members
 * Add a member to a company
 */
export const companyMembersStoreDto = {
  params: t.Object({
    organizationUuid: t.String({
      description: 'Company UUID',
    }),
  }),
  body: t.Object({
    // Option 1: Add existing user by UUID
    userId: t.Optional(
      t.String({
        description: 'Existing user UUID to add as member (required if not creating new user)',
      }),
    ),
    // Option 2: Create new user and add as member
    createUser: t.Optional(
      t.Object({
        email: t.String({ minLength: 3, maxLength: 255 }),
        password: t.String({ minLength: 8, maxLength: 32 }),
        firstName: t.String({ minLength: 2, maxLength: 50 }),
        lastName: t.String({ minLength: 2, maxLength: 50 }),
        gender: t.Enum(Gender),
        isActive: t.Optional(t.Boolean()),
      }),
    ),
    // Required role assignments (at least one role must be assigned)
    roleUuids: t.Array(t.String(), {
      description: 'Array of role UUIDs to assign to the member (at least one required)',
      minItems: 1,
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      userId: t.String({
        description: 'UUID of the user that was added (existing or newly created)',
      }),
      created: t.Boolean({
        description: 'Whether a new user was created',
      }),
    }),
  },
  detail: {
    summary: 'Add Company Member',
    description:
      'Add a member to the company. Either provide userId for existing user, or createUser object to create new user',
  },
} satisfies ControllerHook;

/**
 * PUT /organizations/company/:organizationUuid/members/:userId
 * Update a company member
 */
export const companyMembersUpdateDto = {
  params: t.Object({
    organizationUuid: t.String({
      description: 'Company UUID',
    }),
    userId: t.String({
      description: 'User UUID to update',
    }),
  }),
  body: t.Object({
    // Optional user information updates (nested under 'user')
    user: t.Optional(
      t.Object({
        firstName: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
        lastName: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
        email: t.Optional(t.String({ minLength: 3, maxLength: 255 })),
        gender: t.Optional(t.Enum(Gender)),
        isActive: t.Optional(t.Boolean()),
        password: t.Optional(t.String({ minLength: 8, maxLength: 32 })),
      }),
    ),
    // Optional role assignments (replaces existing roles)
    roleUuids: t.Optional(
      t.Array(t.String(), {
        description: 'Optional array of role UUIDs to assign (replaces existing roles)',
      }),
    ),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
  detail: {
    summary: 'Update Company Member',
    description: 'Update company member roles and user information',
  },
} satisfies ControllerHook;

/**
 * PUT /organizations/company/:organizationUuid/members/:userId/avatar
 * Update company member avatar
 */
export const companyMemberAvatarUpdateDto = {
  params: t.Object({
    organizationUuid: t.String({
      description: 'Company UUID',
    }),
    userId: t.String({
      description: 'User UUID',
    }),
  }),
  body: t.Object({
    file: t.File({
      description: 'Avatar image file',
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      avatarUrl: t.String(),
    }),
  },
  detail: {
    summary: 'Update Company Member Avatar',
    description: 'Update the avatar of a company member',
  },
} satisfies ControllerHook;
