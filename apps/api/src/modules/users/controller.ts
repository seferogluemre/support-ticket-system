import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { PERMISSIONS, auth, authSwagger, dtoWithPermission, ensureUserHasPermission, withPermission } from '../auth';
import { userCreateDto, userDestroyDto, userIndexDto, userShowDto, userUpdateDto } from './dtos';
import { UserFormatter } from './formatters';
import { UsersService } from './service';
import { userRolesApp } from './user-roles';

const app = new Elysia({
  prefix: '/users',
  detail: {
    tags: ['User'],
  },
})
  .use(userRolesApp)
  .guard(authSwagger, (app) =>
    app
      .use(auth())
      .post(
        '', // add user
        async ({ body }) => {
          const user = await UsersService.store(body);
          return UserFormatter.response(user);
        },
        dtoWithMiddlewares(
          userCreateDto,
          withPermission(PERMISSIONS.USER_BASIC.CREATE),
          withAuditLog<typeof userCreateDto>({
            actionType: AuditLogAction.CREATE,
            entityType: AuditLogEntity.USER,
            getEntityUuid: (ctx) => {
              // @ts-ignore // TODO: fix this
              const response = ctx.response as ReturnType<Awaited<typeof UserFormatter.response>>;
              return response.id;
            },
            getDescription: () => 'Yeni kullanıcı oluşturuldu',
          }),
        ),
      )
      .get(
        '', // index
        async ({ query, user }) => {
          const { data, total } = await UsersService.index(query, user);
          const { page = 1, perPage = 20 } = query || {};
          
          return {
            data: data.map(UserFormatter.response),
            meta: {
              total,
              page,
              perPage,
              pageCount: Math.ceil(total / perPage),
            },
          };
        },
        dtoWithPermission(userIndexDto, PERMISSIONS.USER_BASIC.LIST),
      )
      .get(
        '/:id', // show
        async ({ params: { id }, query, user }) => {
          const targetUser = await UsersService.show({ id }, query?.recordStatus, query?.status);

          // 🔒 Users can view themselves without permission
          // Otherwise need SHOW permission
          if (user.id !== id) {
            await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.SHOW);
          }

          const response = UserFormatter.response(targetUser);
          return response;
        },
        userShowDto,
      )
      .patch(
        '/:id', // update
        async ({ params: { id }, body, user }) => {
          // 🔍 Check which fields are being updated
          const isUpdatingProfile = body.email || body.firstName || body.lastName || body.gender || body.imageFile;
          const isUpdatingPassword = body.password;
          const isUpdatingStatus = body.isActive !== undefined;

          // 🔒 Permission checks for updating another user
          if (user.id !== id) {
            if (isUpdatingProfile) {
              await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.UPDATE_PROFILE);
            }
            if (isUpdatingPassword) {
              await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.UPDATE_PASSWORD);
            }
            if (isUpdatingStatus) {
              await ensureUserHasPermission(user, PERMISSIONS.USER_BASIC.UPDATE_STATUS);
            }
          }

          // ✅ Users can always update their own profile, password, status (no permission check needed)
          const updatedUser = await UsersService.update(id, body);
          const response = UserFormatter.response(updatedUser);
          return response;
        },
        dtoWithMiddlewares(
          userUpdateDto,
          withAuditLog<typeof userUpdateDto>({
            actionType: AuditLogAction.UPDATE,
            entityType: AuditLogEntity.USER,
            getEntityUuid: ({ params }) => params.id!,
            getDescription: ({ body }) => `Kullanıcı güncellendi`,
          }),
        ),
      )
      .delete(
        '/:id', // destroy
        async ({ params: { id } }) => {
          await UsersService.destroy(id);
          return { message: 'Kullanıcı silindi' };
        },
        dtoWithMiddlewares(
          userDestroyDto,
          withPermission(PERMISSIONS.USER_ADMIN.DESTROY),
          withAuditLog<typeof userDestroyDto>({
            actionType: AuditLogAction.DELETE,
            entityType: AuditLogEntity.USER,
            getEntityUuid: ({ params }) => params.id!,
            getDescription: () => 'Kullanıcı silindi',
          }),
        ),
      ),
  );

export default app;
