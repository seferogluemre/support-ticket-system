// ====================================================================
// 📨 BACKEND TYPES - Backend'den direkt import
// ====================================================================

export type {
  CompanyResponse as Company,
  CompanyCreatePayload,
  CompanyUpdatePayload,
} from '#backend/modules/companies/types';

// Query types için backend'den import
export type { Static } from 'elysia';
import type { companyIndexDto } from '#backend/modules/companies/dtos';
import { Static } from 'elysia';

export type CompanyFilters = Static<typeof companyIndexDto.query>;
