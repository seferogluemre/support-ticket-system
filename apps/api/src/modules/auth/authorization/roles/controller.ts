import { dtoWithMiddlewares } from '#utils';
import { Elysia } from 'elysia';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../../../audit-logs';
import { auth, authSwagger } from '../../../auth';
import {
  roleAssignMemberDto,
  roleDestroyDto,
  roleGetMembersDto,
  roleIndexDto,
  roleRemoveMemberDto,
  roleReorderDto,
  roleShowDto,
  roleStoreDto,
  roleSyncMembersDto,
  roleUpdateDto,
} from './dtos';
import { RoleFormatter } from './formatters';
import { RoleAssignmentService } from './role-assignment.service';
import { RolesService } from './service';
import type { OrganizationType } from '@onlyjs/db/enums';

const app = new Elysia({
  prefix: '/roles',
  detail: {
    tags: ['Role'],
  },
}).guard(authSwagger, (app) =>
  app
    .use(auth())
    .get(
      '',
      async ({ query, user }) => {
        // 🛡️ Row-level security: Service layer'da yapılıyor
        // - LIST_GLOBALS: Global rolleri listeleyebilir
        // - LIST_ALL_ORGANIZATIONS: Tüm org rollerini listeleyebilir
        // - Organization üyesi: O org'ın rollerini listeleyebilir
        const roles = await RolesService.index(query, user);
        const response = await RoleFormatter.responseList(roles);
        return response;
      },
      roleIndexDto,
    )
    .get(
      '/:uuid',
      async ({ params: { uuid }, user }) => {
        // 🛡️ Row-level security: Service layer'da yapılıyor
        // - SHOW_GLOBALS: Global rolleri görebilir
        // - SHOW_ALL_ORGANIZATIONS: Tüm org rollerini görebilir
        // - Organization üyesi: O org'ın rollerini görebilir
        // - Kendi rolü: Her zaman görebilir
        const role = await RolesService.show(uuid, user);
        const response = await RoleFormatter.response(role);
        return response;
      },
      roleShowDto,
    )
    .post(
      '',
      async ({ body, user }) => {
        // 🛡️ Service layer checks:
        // - UPDATE_GLOBALS or UPDATE_ALL_ORGANIZATIONS permission
        // - Order hierarchy (new role order < userHighestOrder)
        const role = await RolesService.store(body, user!);
        const response = await RoleFormatter.response(role);
        return response;
      },
      dtoWithMiddlewares(
        roleStoreDto,
        withAuditLog<typeof roleStoreDto>({
          actionType: AuditLogAction.CREATE,
          entityType: AuditLogEntity.ROLE,

          // @ts-ignore
          getEntityUuid: (ctx) => ctx.response.uuid,
          getDescription: () => 'Yeni rol oluşturuldu',
          getMetadata: ({ body }) => ({ createdFields: body }),
        }),
      ),
    )
    .patch(
      '/:uuid',
      async ({ params: { uuid }, body, user }) => {
        // 🛡️ Service layer checks:
        // - UPDATE_GLOBALS or UPDATE_ALL_ORGANIZATIONS permission
        // - Order hierarchy (role.order < userHighestOrder)
        // - Organization membership (for org roles)
        const role = await RolesService.update(uuid, body, user!);
        const response = await RoleFormatter.response(role);
        return response;
      },
      dtoWithMiddlewares(
        roleUpdateDto,
        withAuditLog<typeof roleUpdateDto>({
          actionType: AuditLogAction.UPDATE,
          entityType: AuditLogEntity.ROLE,
          getEntityUuid: ({ params }) => params.uuid!,
          getDescription: ({ body }) => `Rol güncellendi: ${Object.keys(body).join(', ')}`,
          getMetadata: ({ body }) => ({ updatedFields: body }),
        }),
      ),
    )
    .delete(
      '/:uuid',
      async ({ params: { uuid }, user }) => {
        // 🛡️ Service layer checks:
        // - DELETE_GLOBALS or DELETE_ALL_ORGANIZATIONS permission
        // - Order hierarchy (role.order < userHighestOrder)
        // - Organization membership (for org roles)
        await RolesService.destroy(uuid, user);
        return { message: 'Rol silindi' };
      },
      dtoWithMiddlewares(
        roleDestroyDto,
        withAuditLog<typeof roleDestroyDto>({
          actionType: AuditLogAction.DELETE,
          entityType: AuditLogEntity.ROLE,
          getEntityUuid: ({ params }) => params.uuid!,
          getDescription: () => 'Rol silindi',
        }),
      ),
    )
    // 🎯 ROLE REORDERING
    .patch(
      '/reorder',
      async ({ body, user }) => {
        const typedBody = body as {
          roles: Array<{ uuid: string; order: number }>;
          organizationType?: OrganizationType;
          organizationUuid?: string;
        };
        const updated = await RolesService.reorderRoles(
          typedBody.roles,
          user!,
          typedBody.organizationType,
          typedBody.organizationUuid,
        );
        return {
          message: `${updated} rol başarıyla yeniden sıralandı`,
          updated,
        };
      },
      dtoWithMiddlewares(
        roleReorderDto,
        withAuditLog({
          actionType: AuditLogAction.UPDATE,
          entityType: AuditLogEntity.ROLE,
          getEntityUuid: () => 'bulk-reorder', // Bulk operation
          getDescription: ({ body }) => {
            const typedBody = body as { roles: Array<{ uuid: string; order: number }> };
            return `${typedBody.roles.length} rol yeniden sıralandı`;
          },
        }),
      ),
    )
    // 👥 MEMBER MANAGEMENT
    .get(
      '/:uuid/members',
      async ({ params }) => {
        const members = await RolesService.getRoleMembers(params.uuid);
        return members;
      },
      roleGetMembersDto,
    )
    .post(
      '/:uuid/members',
      async ({ params, body, user }) => {
        const typedBody = body as { userId: string };
        // 🛡️ Service layer checks:
        // - Global role: USERS.MANAGE required
        // - Org role (same org): USERS.MANAGE_OWN_ORGANIZATION required
        // - Org role (diff org): USERS.MANAGE_ALL_ORGANIZATIONS required
        // - Role hierarchy check (order)
        await RoleAssignmentService.addRoleToUser(params.uuid, typedBody.userId, user!);
        return { success: true };
      },
      dtoWithMiddlewares(
        roleAssignMemberDto,
        withAuditLog({
          actionType: AuditLogAction.CREATE,
          entityType: AuditLogEntity.USER_ROLE,
          getEntityUuid: () => '', // UserRole'ün uuid'si yok, boş string
          getDescription: () => 'Kullanıcıya rol atandı',
        }),
      ),
    )
    .delete(
      '/:uuid/members/:userId',
      async ({ params, user }) => {
        // 🛡️ Service layer checks:
        // - Global role: USERS.MANAGE required
        // - Org role (same org): USERS.MANAGE_OWN_ORGANIZATION required
        // - Org role (diff org): USERS.MANAGE_ALL_ORGANIZATIONS required
        // - Role hierarchy check (order)
        await RoleAssignmentService.removeRoleFromUser(params.uuid, params.userId, user!);
        return { success: true };
      },
      dtoWithMiddlewares(
        roleRemoveMemberDto,
        withAuditLog({
          actionType: AuditLogAction.DELETE,
          entityType: AuditLogEntity.USER_ROLE,
          getEntityUuid: () => '', // UserRole'ün uuid'si yok, boş string
          getDescription: () => 'Kullanıcıdan rol kaldırıldı',
        }),
      ),
    )
    .put(
      '/:uuid/members/sync',
      async ({ params, body, user }) => {
        const typedBody = body as { userIds: string[] };
        // 🛡️ Service layer handles all permission checks for each add/remove
        const result = await RoleAssignmentService.syncRoleMembers(
          params.uuid,
          typedBody.userIds,
          user!,
        );
        return {
          message: `${result.added} üye eklendi, ${result.removed} üye çıkarıldı`,
          added: result.added,
          removed: result.removed,
        };
      },
      dtoWithMiddlewares(
        roleSyncMembersDto,
        withAuditLog({
          actionType: AuditLogAction.UPDATE,
          entityType: AuditLogEntity.ROLE,
          getEntityUuid: ({ params }) => params.uuid!,
          getDescription: ({ body }) => {
            const typedBody = body as { userIds: string[] };
            return `Rol üyeleri senkronize edildi (${typedBody.userIds.length} üye)`;
          },
        }),
      ),
    ),
);

export default app;
