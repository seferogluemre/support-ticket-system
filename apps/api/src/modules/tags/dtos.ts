import {
  TagPlain,
  TagPlainInputCreate,
  TagPlainInputUpdate,
} from "@onlyjs/db/prismabox/Tag";
import { t } from "elysia";
import {
  type ControllerHook,
  errorResponseDto,
  uuidValidation,
} from "../../utils";
import {
  paginationQueryDto,
  paginationResponseDto,
} from "../../utils/pagination";

export const tagResponseDto = TagPlain;

export const tagIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    search: t.Optional(t.String()),
    companyUuid: t.Optional(t.String()),
  }),
  response: {
    200: paginationResponseDto(tagResponseDto),
  },
  detail: {
    summary: "Index",
    description: "Etiketlerin listesini döndürür",
  },
} satisfies ControllerHook;

export const tagCreateDto = {
  body: t.Composite([
    TagPlainInputCreate,
    t.Object({
      companyUuid: uuidValidation,
    }),
  ]),
  response: { 200: tagResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: "Create",
    description: "Yeni etiket oluşturur",
  },
} satisfies ControllerHook;

export const tagUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Composite([
    TagPlainInputUpdate,
    t.Object({
      companyUuid: uuidValidation,
    }),
  ]),
  response: {
    200: tagResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Update",
    description: "Etiketi günceller",
  },
} satisfies ControllerHook;

export const tagShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: tagResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: "Show",
    description: "Etiket detaylarını döndürür",
  },
} satisfies ControllerHook;

export const tagDestroyDto = {
  ...tagShowDto,
  body: t.Object({
    companyUuid: uuidValidation,
  }),
  response: {
    200: t.Object({ message: t.String() }),
    404: errorResponseDto[404],
  },
  detail: {
    summary: "Destroy",
    description: "Etiketi siler",
  },
} satisfies ControllerHook;
