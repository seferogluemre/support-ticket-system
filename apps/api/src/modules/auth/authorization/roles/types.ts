import type { Static } from 'elysia';
import {
    roleGetMembersDto,
    roleIndexDto,
    roleReorderDto,
    RoleResponseSchema,
    roleShowDto,
    roleShowResponseDto,
    roleStoreDto,
    roleUpdateDto,
} from './dtos';

// ✅ Generate types from DTOs (Single Source of Truth)
export type RoleShowResponse = Static<typeof roleShowResponseDto>;
export type RoleResponseDto = Static<typeof RoleResponseSchema>; // ✅ From DTO schema
export type RoleCreatePayload = Static<(typeof roleStoreDto)['body']>;
export type RoleUpdatePayload = Static<(typeof roleUpdateDto)['body']>;
export type RoleShowParams = Static<(typeof roleShowDto)['params']>;
export type RoleDestroyParams = RoleShowParams;
export type RoleReorderPayload = Static<(typeof roleReorderDto)['body']>;

export type RoleIndexQuery = Static<(typeof roleIndexDto)['query']>;

// Role Members
export type RoleMemberResponse = Static<(typeof roleGetMembersDto)['response'][200]>[number];

