import type { Static } from 'elysia';
import {
    addPermissionDto,
    getUserPermissionsDto,
    listDirectPermissionsDto,
    removePermissionDto,
} from './dtos';

// ✅ Generate types from DTOs (Single Source of Truth)
export type AddPermissionPayload = Static<(typeof addPermissionDto)['body']>;
export type RemovePermissionParams = Static<(typeof removePermissionDto)['params']>;
export type RemovePermissionQuery = Static<(typeof removePermissionDto)['query']>;
export type DirectPermissionDto = Static<(typeof listDirectPermissionsDto)['response']['200']>[number];
export type UserPermissionsParams = Static<(typeof getUserPermissionsDto)['params']>;
