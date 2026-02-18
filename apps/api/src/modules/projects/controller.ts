import { Elysia } from 'elysia';
import { dtoWithMiddlewares, NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth } from '../auth';
import {
  projectCreateDto,
  projectDestroyDto,
  projectIndexDto,
  projectShowDto,
  projectUpdateDto,
} from './dtos';
import { ProjectFormatter } from './formatters';
import { ProjectsService } from './service';

/**
 * Projects Controller
 *
 * Bu controller permission-based authorization örneğidir:
 *
 * 1. LIST (GET /):
 *    - projects:list-all: Tüm company'lerin projelerini listeler
 *    - projects:list-own-company: Sadece üye olunan company'lerin projelerini listeler
 *
 * 2. SHOW (GET /:uuid):
 *    - projects:show-all: Tüm projeleri gösterir
 *    - projects:show-own-company: Sadece üye olunan company'lerin projelerini gösterir
 *
 * 3. CREATE (POST /):
 *    - projects:create: Company'de proje oluşturma yetkisi (company scope)
 *
 * 4. UPDATE (PUT /:uuid):
 *    - projects:update-all: Tüm projeleri güncelleme yetkisi (global scope)
 *    - projects:update-own-company: Üye olunan company'lerin projelerini güncelleme (company scope)
 *
 * 5. DELETE (DELETE /:uuid):
 *    - projects:delete-all: Tüm projeleri silme yetkisi (global scope)
 *    - projects:delete-own-company: Üye olunan company'lerin projelerini silme (company scope)
 */
const app = new Elysia({ prefix: '/projects', tags: ['Projects'] })
  .use(auth())
  .get(
    '/',
    async ({ query, user }) => {
      const { data, total } = await ProjectsService.index(query, user.id);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: ProjectFormatter.response,
      });
    },
    projectIndexDto,
  )
  .get(
    '/:uuid',
    async ({ params, user }) => {
      const project = await ProjectsService.show(params.uuid, user.id);
      if (!project) throw new NotFoundException('Proje bulunamadı');
      return ProjectFormatter.response(project);
    },
    projectShowDto,
  )
  .post(
    '/',
    async ({ body, user }) => {
      const { companyUuid, startDate, endDate, ...projectData } = body;
      const project = await ProjectsService.store(
        {
          ...projectData,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        user.id,
        companyUuid,
      );
      return ProjectFormatter.response(project);
    },
    dtoWithMiddlewares(
      projectCreateDto,
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.PROJECT,
        getEntityUuid: (ctx) => {
          // @ts-ignore
          const response = ctx.response as ReturnType<typeof ProjectFormatter.response>;
          return response.uuid;
        },
        getDescription: (ctx) => {
          // @ts-ignore
          const response = ctx.response as ReturnType<typeof ProjectFormatter.response>;
          return `Yeni proje oluşturuldu: ${response.name}`;
        },
        getMetadata: (ctx) => ({
          // @ts-ignore
          companyUuid: ctx.body.companyUuid,
          // @ts-ignore
          projectName: ctx.response.name,
        }),
      }),
    ),
  )
  .put(
    '/:uuid',
    async ({ params, body, user }) => {
      const { startDate, endDate, ...updateData } = body;
      const project = await ProjectsService.update(
        params.uuid,
        {
          ...updateData,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        user.id,
      );
      if (!project) throw new NotFoundException('Proje bulunamadı');
      return ProjectFormatter.response(project);
    },
    dtoWithMiddlewares(
      projectUpdateDto,
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.PROJECT,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Proje güncellendi: ${Object.keys(body as object).join(', ')}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      }),
    ),
  )
  .delete(
    '/:uuid',
    async ({ params, user }) => {
      const project = await ProjectsService.destroy(params.uuid, user.id);
      if (!project) throw new NotFoundException('Proje bulunamadı');
      return { message: 'Proje başarıyla silindi' };
    },
    dtoWithMiddlewares(
      projectDestroyDto,
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.PROJECT,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Proje silindi',
      }),
    ),
  );

export default app;