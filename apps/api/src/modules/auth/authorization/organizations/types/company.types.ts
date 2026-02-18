import type { Static } from 'elysia';
import {
  companyMemberDetailsObjectSchema,
  companyMemberObjectSchema,
  type companyMembersStoreDto,
  type companyMembersUpdateDto,
} from '../dtos/company.dtos';
import type { MemberData } from '../types';

/**
 * Company-specific member data
 */
export interface CompanyMemberData extends MemberData {
}

/**
 * Company member - generated from DTO schema
 */
export type CompanyMember = Static<typeof companyMemberObjectSchema>;

/**
 * Company member details - generated from DTO schema
 */
export type CompanyMemberDetails = Static<typeof companyMemberDetailsObjectSchema>;

export type CompanyMemberCreatePayload = Static<typeof companyMembersStoreDto.body>;

export type CompanyMemberCreateResponse = Static<(typeof companyMembersStoreDto.response)[200]>;

export type CompanyMemberUpdatePayload = Static<typeof companyMembersUpdateDto.body>;

export type CompanyMemberUpdateResponse = Static<(typeof companyMembersUpdateDto.response)[200]>;
