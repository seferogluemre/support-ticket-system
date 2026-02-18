import type { ControllerHook } from '#utils';
import { t } from 'elysia';

/**
 * Base member object schema
 * Bu schema tüm organization member response'larında ortak alanları tanımlar
 */
export const baseMemberObjectSchema = t.Object({
  userId: t.String(),
  email: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  name: t.String(),
  image: t.Union([t.String(), t.Null()]),
  isActive: t.Boolean(),
  isAdmin: t.Boolean({
    description: 'Whether user has at least one ADMIN type role in this organization',
  }),
  isOwner: t.Boolean({
    description: 'Whether user is the owner of this organization',
  }),
  joinedAt: t.Date(),
  membershipUpdatedAt: t.Date(),
  userCreatedAt: t.Date(),
  roles: t.Array(
    t.Object({
      uuid: t.String(),
      name: t.String(),
      type: t.String(),
      order: t.Number(),
      assignedAt: t.Date(),
    }),
  ),
});

/**
 * Base member details object schema
 * Member detay response'ları için ortak alanları tanımlar
 */
export const baseMemberDetailsObjectSchema = t.Object({
  userId: t.String(),
  email: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  name: t.String(),
  image: t.Union([t.String(), t.Null()]),
  gender: t.String(),
  isActive: t.Boolean(),
  isAdmin: t.Boolean({
    description: 'Whether user has at least one ADMIN type role in this organization',
  }),
  isOwner: t.Boolean({
    description: 'Whether user is the owner of this organization',
  }),
  joinedAt: t.Date(),
  membershipUpdatedAt: t.Date(),
  userCreatedAt: t.Date(),
  userUpdatedAt: t.Date(),
  roles: t.Array(
    t.Object({
      uuid: t.String(),
      name: t.String(),
      description: t.Union([t.String(), t.Null()]),
      type: t.String(),
      order: t.Number(),
      permissions: t.Any({
        description: 'Array of permission codes',
      }),
      assignedAt: t.Date(),
    }),
  ),
});

/**
 * DELETE /organizations/:organizationType/:organizationUuid/members/:userId
 * Remove a member from an organization (generic - works for all org types)
 */
export const membersDestroyDto = {
  params: t.Object({
    organizationType: t.String({
      description: 'Organization type',
    }),
    organizationUuid: t.String({
      description: 'Organization UUID',
    }),
    userId: t.String({
      description: 'User UUID to remove',
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
    }),
  },
  detail: {
    summary: 'Remove Organization Member',
    description: 'Remove a member from the organization (removes all roles and membership)',
  },
} satisfies ControllerHook;
