import { t } from 'elysia';
import { type ControllerHook, errorResponseDto } from '../../../utils';
import { userResponseSchema } from '../dtos';
import { OrganizationType } from '@onlyjs/db/enums';

export const userRoleUpdateDto = {
  params: t.Object({
    id: t.String({
      description: 'User UUID',
    }),
  }),
  query: t.Optional(
    t.Object({
      organizationType: t.Optional(
        t.String({
          description: 'Organization type (e.g., OrganizationType.COMPANY) - for organization-scoped roles',
          examples: [OrganizationType.COMPANY],
        }),
      ),
      organizationUuid: t.Optional(
        t.String({
          description: 'Organization UUID - required if organizationType is provided',
        }),
      ),
    }),
  ),
  body: t.Object({
    roleUuids: t.Array(t.String(), {
      description: 'Array of role UUIDs to assign (replaces all roles in the specified scope)',
      examples: [['550e8400-e29b-41d4-a716-446655440000']],
    }),
  }),
  response: {
    200: userResponseSchema,
    400: errorResponseDto[400],
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Update User Roles',
    description: `
      Update user roles in global or organization scope.
      
      **Global Roles:**
      - No query params: Updates global roles only
      - Example: PATCH /users/:id/roles with body { roleUuids: ["550e8400-e29b-41d4-a716-446655440000"] }
      
      **Organization Roles:**
      - With query params: Updates roles within specific organization
      - Example: PATCH /users/:id/roles?organizationType=company&organizationUuid=xxx with body { roleUuids: ["550e8400..."] }
      
      Both organizationType and organizationUuid must be provided together.
    `,
  },
} satisfies ControllerHook;
