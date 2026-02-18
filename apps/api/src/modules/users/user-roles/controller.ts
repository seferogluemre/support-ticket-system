import { Elysia } from 'elysia';
import { BadRequestException, dtoWithMiddlewares } from '../../../utils';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../../audit-logs';
import { auth, authSwagger } from '../../auth';
import { organizationRegistry } from '../../auth/authorization/organizations';
import type { OrganizationType } from '@onlyjs/db/enums';
import { UserFormatter } from '../formatters';
import { userRoleUpdateDto } from './dtos';
import { UserRolesService } from './service';

const app = new Elysia().guard(authSwagger, (app) =>
  app.use(auth()).patch(
    '/:id/roles',
    async ({ params: { id }, query, body, user }) => {
      // Validate query params: both or neither must be provided
      const hasOrgType = query?.organizationType !== undefined;
      const hasOrgUuid = query?.organizationUuid !== undefined;

      if (hasOrgType !== hasOrgUuid) {
        throw new BadRequestException(
          'Both organizationType and organizationUuid must be provided together, or neither',
        );
      }

      // Prepare scope (null = global, object = organization-specific)
      let scope: { organizationType: OrganizationType; organizationId: number } | null = null;

      if (hasOrgType && hasOrgUuid) {
        // Organization-scoped roles
        const orgType = query!.organizationType as string;
        const adapter = organizationRegistry.get(orgType);
        if (!adapter) {
          throw new BadRequestException(
            `Invalid organization type: ${orgType}`,
          );
        }

        const organizationId = await adapter.getOrganizationId(query!.organizationUuid!);
        if (!organizationId) {
          throw new BadRequestException('Organization not found');
        }

        scope = {
          organizationType: query!.organizationType! as OrganizationType,
          organizationId,
        };
      }

      // UserRolesService.update() handles ALL validations:
      // - Own role check
      // - Permission checks
      // - Hierarchy checks
      // - Permission guardrails
      // - Membership validation (for organization scope)
      // - Adapter hooks (for organization scope)
      const updatedUser = await UserRolesService.update(
        id,
        body.roleUuids,
        user,
        undefined, // No external transaction
        scope,
      );

      const response = UserFormatter.response(updatedUser);
      return response;
    },
    dtoWithMiddlewares(
      userRoleUpdateDto,
      withAuditLog<typeof userRoleUpdateDto>({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.USER_ROLE,
        getEntityUuid: ({ params }) => params.id!,
        getDescription: ({ query, body }) => {
          const scope = query?.organizationType
            ? ` (${query.organizationType} organizasyonu)`
            : ' (global)';
          return `Kullanıcı rolleri güncellendi${scope}`;
        },
        getMetadata: ({ query, body }) => ({
          scope: query?.organizationType
            ? { organizationType: query.organizationType, organizationUuid: query.organizationUuid }
            : 'global',
          roleUuids: body.roleUuids,
        }),
      }),
    ),
  ),
);

export default app;
