import type { ControllerHook } from '#utils';
import { t } from 'elysia';
import { userResponseSchema } from '../../users/dtos';

/**
 * Claims schema - user permissions grouped by scope
 */
export const claimsSchema = t.Object({
  global: t.Array(t.String(), {
    description: 'Global permissions (system-wide)',
  }),
  organizations: t.Record(
    t.String(),
    t.Record(t.String(), t.Array(t.String())),
    {
      description: 'Organization-scoped permissions: { organizationType: { organizationUuid: [permissions] } }',
    },
  ),
});

/**
 * Global role schema (minimal info)
 */
export const globalRoleSchema = t.Object({
  uuid: t.String(),
});

/**
 * Organization membership summary schema
 * Shows user's membership in a specific organization
 */
export const organizationMembershipSummarySchema = t.Object({
  organization: t.Object({
    type: t.String({
      description: 'Organization type (e.g., company)',
    }),
    uuid: t.String({
      description: 'Organization UUID',
    }),
    name: t.String({
      description: 'Organization name',
    }),
    logoSrc: t.Union([t.String(), t.Null()], {
      description: 'Organization logo URL',
    }),
  }),
  isAdmin: t.Boolean({
    description: 'Whether user has at least one ADMIN type role in this organization',
  }),
  isOwner: t.Boolean({
    description: 'Whether user is the owner of this organization',
  }),
  joinedAt: t.Date({
    description: 'When user joined this organization',
  }),
  membershipUpdatedAt: t.Date({
    description: 'When membership was last updated',
  }),
  roles: t.Array(
    t.Object({
      uuid: t.String(),
      name: t.String(),
      type: t.String(),
      order: t.Number(),
    }),
    {
      description: 'Roles assigned to user in this organization',
    },
  ),
});

/**
 * User membership cache schema (organization-agnostic)
 * Extends user response with claims and organization memberships
 */
const authMeResponseSchema = t.Composite([
  userResponseSchema,
  t.Object({
    claims: claimsSchema,
    globalRoles: t.Array(globalRoleSchema, {
      description: 'Global roles (no organization context)',
    }),
    organizationMemberships: t.Array(organizationMembershipSummarySchema, {
      description: 'All organization memberships across all organization types',
    }),
  }),
]);

/**
 * GET /auth/me
 * Get current user with permissions and organization memberships
 */
export const authMeDto = {
  response: {
    200: authMeResponseSchema,
  },
  detail: {
    summary: 'Me (Current User)',
    description:
      'Returns current user with permissions, roles, and all organization memberships (across all organization types)',
  },
} satisfies ControllerHook;

