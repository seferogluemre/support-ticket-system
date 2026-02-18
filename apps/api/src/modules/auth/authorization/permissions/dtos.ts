import { t } from 'elysia';
import { OrganizationTypeSchema } from '../organizations';

/**
 * Permission Scope Schema
 * 'global' | OrganizationType
 */
const PermissionScopeSchema = t.Union([
  t.Literal('global'),
  OrganizationTypeSchema,
]);

/**
 * ============================================================================
 * Query DTOs
 * ============================================================================
 */

/**
 * DTO for listing permissions
 */
export const permissionIndexDto = {
  query: t.Object({
    organizationType: t.Optional(
      t.Union([OrganizationTypeSchema, t.Null()], {
        description: 'Organization type to filter permissions (null for global)',
      }),
    ),
  }),
  response: t.Array(t.String(), {
    description: 'List of permission keys',
  }),
  detail: {
    summary: 'List all permissions',
    description: 'Returns all available permissions, optionally filtered by organization type',
  },
};

/**
 * DTO for getting permission groups
 */
export const permissionGroupsDto = {
  query: t.Object({
    organizationType: t.Optional(
      t.Union([OrganizationTypeSchema, t.Null()], {
        description: 'Organization type to filter permission groups',
      }),
    ),
  }),
  response: t.Record(
    t.String(),
    t.Object({
      key: t.String({ description: 'Group key' }),
      description: t.String({ description: 'Group description' }),
      permissions: t.Array(
        t.Object({
          key: t.String({ description: 'Unique permission key' }),
          description: t.String({ description: 'Human-readable permission description' }),
          scopes: t.Array(t.String(), {
            description: 'Scopes where this permission is valid (global, company, etc.)',
          }),
          hiddenOn: t.Optional(
            t.Union([t.Literal(true), t.Array(t.String())], {
              description: 'Whether this permission is hidden (true for all scopes) or hidden in specific scopes (array)',
            }),
          ),
          dependsOn: t.Optional(t.Any({
            description: 'Permission dependencies - can be a string, array, or object with and/or operators',
          })),
        }),
        {
          description: 'Permissions in this group',
        },
      ),
    }),
    {
      description: 'Permission groups indexed by key',
    },
  ),
  detail: {
    summary: 'Get permission groups',
    description: 'Returns permission groups, optionally filtered by organization type',
  },
};


