import { Elysia } from "elysia";
import { dtoWithMiddlewares, NotFoundException } from "../../utils";
import { PaginationService } from "../../utils/pagination";
import { AuditLogAction, AuditLogEntity, withAuditLog } from "../audit-logs";
import { auth, PERMISSIONS, withPermission } from "../auth";
import {
  tagCreateDto,
  tagDestroyDto,
  tagIndexDto,
  tagShowDto,
  tagUpdateDto,
} from "./dtos";
import { TagFormatter } from "./formatters";
import { TagsService } from "./service";

const app = new Elysia({ prefix: "/tags", tags: ["Tag"] })
  .use(auth()) // ── Public GET endpoints (authentication gerekmez) ──────────────────
  .get(
    "/",
    async ({ query }) => {
      const { data, total } = await TagsService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: TagFormatter.response,
      });
    },
    tagIndexDto,
  )
  .get(
    "/:uuid",
    async ({ params }) => {
      const tag = await TagsService.show(params.uuid);
      if (!tag) throw new NotFoundException("Etiket bulunamadı");
      return TagFormatter.response(tag);
    },
    tagShowDto,
  )
  // ── Protected endpoints (authentication + permission gerekir) ────────

  .post(
    "/",
    async ({ body }) => {
      const tag = await TagsService.store(body);
      return TagFormatter.response(tag);
    },
    dtoWithMiddlewares(
      tagCreateDto,
      withPermission(PERMISSIONS.TAGS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.TAG,
        getEntityUuid: (ctx) => {
          // @ts-ignore
          const response = ctx.response as ReturnType<
            typeof TagFormatter.response
          >;
          return response.uuid;
        },
        getDescription: () => "Yeni etiket oluşturuldu",
      }),
    ),
  )
  .put(
    "/:uuid",
    async ({ params, body }) => {
      const tag = await TagsService.update(params.uuid, body.companyUuid, body);
      if (!tag) throw new NotFoundException("Etiket bulunamadı");
      return TagFormatter.response(tag);
    },
    dtoWithMiddlewares(
      tagUpdateDto,
      withPermission(PERMISSIONS.TAGS.UPDATE_OWN_COMPANY),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.TAG,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Etiket güncellendi: ${Object.keys(body as object).join(", ")}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      }),
    ),
  )
  .delete(
    "/:uuid",
    async ({ params, body }) => {
      const tag = await TagsService.destroy(params.uuid, body.companyUuid);
      if (!tag) throw new NotFoundException("Etiket bulunamadı");
      return { message: "Etiket başarıyla silindi" };
    },
    dtoWithMiddlewares(
      tagDestroyDto,
      withPermission(PERMISSIONS.TAGS.DELETE_OWN_COMPANY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.TAG,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => "Etiket silindi",
      }),
    ),
  );

export default app;
