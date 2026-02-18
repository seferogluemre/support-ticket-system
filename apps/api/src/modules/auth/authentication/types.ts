import type { User } from '@onlyjs/db/client';
import type { Context, Static } from 'elysia';
import { authMeDto } from './dtos';

export interface AuthContext extends Context {
  user: User;
}

/**
 * Auth me endpoint response type
 * Extracted from authMeDto response schema
 */
export type AuthMeResponse = Static<typeof authMeDto.response[200]>;
