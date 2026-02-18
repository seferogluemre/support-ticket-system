import { dtoWithMiddlewares } from '#utils';
import { Elysia } from 'elysia';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../../../audit-logs';
import { auth, authSwagger } from '../../authentication/plugin';
import { withPermission } from '../middleware';
import { ensureUserHasPermission } from '../permissions/checks';
import { PERMISSIONS } from '../permissions/constants';
import {
    addPermissionDto,
    getUserPermissionsDto,
    listDirectPermissionsDto,
    removePermissionDto,
} from './dtos';
import { UserPermissionsService } from './service';
import type { AddPermissionPayload } from './types';

const app = new Elysia({
  prefix: '/users',
  detail: {
    tags: ['Direct Permissions'],
    description: 'Direct permission assignment (bypassing roles)',
  },
}).guard(authSwagger, (app) =>
  app
    .use(auth())
    .get(
      '/:uuid/permissions',
      async ({ params, user }) => {
        // Users can view their own permissions without permission
        if (user.id !== params.uuid) {
          // Need SHOW permission to view other users' permissions
          await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.SHOW);
        }
        const permissions = await UserPermissionsService.getUserPermissions(params.uuid);
        return permissions;
      },
      getUserPermissionsDto,
    )
    .get(
      '/:uuid/permissions/direct',
      async ({ params, user }) => {
        // Users can view their own permissions without permission
        if (user.id !== params.uuid) {
          // Need SHOW permission to view other users' permissions
          await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.SHOW);
        }
        const permissions = await UserPermissionsService.listDirectPermissions(params.uuid);
        return permissions;
      },
      listDirectPermissionsDto,
    )
    .post(
      '/:uuid/permissions',
      async ({ params, body, user }) => {
        const typedBody = body as AddPermissionPayload;
        await UserPermissionsService.addPermission(params.uuid, typedBody, user!);
        return { success: true };
      },
      dtoWithMiddlewares(
        addPermissionDto,
        withPermission(PERMISSIONS.USER_PERMISSIONS.ASSIGN_PERMISSION), // Direct permission assignment
        withAuditLog({
          actionType: AuditLogAction.CREATE,
          entityType: AuditLogEntity.USER_PERMISSION,
          getEntityUuid: () => '', // UserPermission has no UUID
          getDescription: () => 'Direct permission added to user',
        }),
      ),
    )
    .delete(
      '/:uuid/permissions/:permissionCode',
      async ({ params, query }) => {
        await UserPermissionsService.removePermission(
          params.uuid,
          params.permissionCode,
          query.organizationType,
          query.organizationUuid,
        );
        return { success: true };
      },
      dtoWithMiddlewares(
        removePermissionDto,
        withPermission(PERMISSIONS.USER_PERMISSIONS.ASSIGN_PERMISSION), // Direct permission removal
        withAuditLog({
          actionType: AuditLogAction.DELETE,
          entityType: AuditLogEntity.USER_PERMISSION,
          getEntityUuid: () => '', // UserPermission has no UUID
          getDescription: () => 'Direct permission removed from user',
        }),
      ),
    ),
);

export default app;

