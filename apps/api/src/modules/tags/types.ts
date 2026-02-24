import type { Static } from "elysia";
import { tagCreateDto, tagResponseDto, tagShowDto, tagUpdateDto } from "./dtos";

export type TagCreatePayload = Static<(typeof tagCreateDto)["body"]>;
export type TagUpdatePayload = Static<(typeof tagUpdateDto)["body"]>;
export type TagShowParams = Static<(typeof tagShowDto)["params"]>;
export type TagShowResponse = Static<typeof tagResponseDto>;
export type TagDestroyParams = TagShowParams;
