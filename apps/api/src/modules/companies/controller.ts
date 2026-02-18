import { Elysia } from 'elysia';
import { dtoWithMiddlewares, PaginationService } from '../../utils';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, authSwagger, dtoWithPermission, PERMISSIONS, withPermission } from '../auth';
import {
  companyCreateDto,
  companyDestroyDto,
  companyIndexDto,
  companyShowDto,
  companyUpdateDto,
} from './dtos';
import { CompanyFormatter } from './formatters';
import { CompanyService } from './service';

const app = new Elysia({
  prefix: '/companies',
  detail: {
    tags: ['Company'],
  },
}).guard(authSwagger, (app) =>
  app
    .use(auth())
    .get(
      '/',
      async ({ query, user }) => {
        // Pass user.id to enable membership filtering
        const { data, total } = await CompanyService.index(query, user.id);
        return PaginationService.createPaginatedResponse({
          data,
          total,
          query,
          formatter: CompanyFormatter.response,
        });
      },
      dtoWithPermission(companyIndexDto, PERMISSIONS.COMPANIES.SHOW),
    )
    .get(
      '/:uuid',
      async ({ params }) => {
        const company = await CompanyService.show(params.uuid);
        return CompanyFormatter.response(company);
      },
      dtoWithPermission(companyShowDto, PERMISSIONS.COMPANIES.SHOW),
    )
    .post(
      '/',
      async ({ body }) => {
        const company = await CompanyService.store(body);
        return CompanyFormatter.response(company);
      },
      dtoWithMiddlewares(
        companyCreateDto,
        withPermission(PERMISSIONS.COMPANIES.CREATE),
        withAuditLog<typeof companyCreateDto>({
          actionType: AuditLogAction.CREATE,
          entityType: AuditLogEntity.COMPANY,
          getEntityUuid: (ctx) => {
            // @ts-ignore // TODO: fix this
            const response = ctx.response as ReturnType<typeof CompanyFormatter.response>;
            return response.uuid;
          },
          getDescription: () => 'Yeni company oluşturuldu',
        }),
      ),
    )
    .patch(
      '/:uuid',
      async ({ params, body }) => {
        const company = await CompanyService.update(params.uuid, body);
        return CompanyFormatter.response(company);
      },
      dtoWithMiddlewares(
        companyUpdateDto,
        withPermission(PERMISSIONS.COMPANIES.UPDATE),
        withAuditLog<typeof companyUpdateDto>({
          actionType: AuditLogAction.UPDATE,
          entityType: AuditLogEntity.COMPANY,
          getEntityUuid: ({ params }) => params.uuid!,
          getDescription: () => 'Company güncellendi',
        }),
      ),
    )
    .delete(
      '/:uuid',
      async ({ params }) => {
        const company = await CompanyService.destroy(params.uuid);
        return CompanyFormatter.response(company);
      },
      dtoWithMiddlewares(
        companyDestroyDto,
        withPermission(PERMISSIONS.COMPANIES.DESTROY),
        withAuditLog<typeof companyDestroyDto>({
          actionType: AuditLogAction.DELETE,
          entityType: AuditLogEntity.COMPANY,
          getEntityUuid: ({ params }) => params.uuid!,
          getDescription: () => 'Company silindi',
        }),
      ),
    ),
);

export default app;
