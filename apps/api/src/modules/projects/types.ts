import type { Static } from 'elysia';
import {
  projectCreateDto,
  projectDestroyDto,
  projectIndexDto,
  projectResponseDto,
  projectShowDto,
  projectUpdateDto,
} from './dtos';

// Response types
export type ProjectShowResponse = Static<typeof projectResponseDto>;

// Payload types - DTO'lardan türetilmiş
export type ProjectCreatePayload = Static<(typeof projectCreateDto)['body']>;
export type ProjectUpdatePayload = Static<(typeof projectUpdateDto)['body']>;

// Params types
export type ProjectShowParams = Static<(typeof projectShowDto)['params']>;
export type ProjectDestroyParams = Static<(typeof projectDestroyDto)['params']>;

// Query types
export type ProjectIndexQuery = Static<(typeof projectIndexDto)['query']>;