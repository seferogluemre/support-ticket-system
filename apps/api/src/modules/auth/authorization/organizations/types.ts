import type { Static } from 'elysia';
import type { BaseOrganizationAdapter } from './base-adapter';
import { baseMemberDetailsObjectSchema, baseMemberObjectSchema } from './dtos/common.dtos';

/**
 * Organization türü için generic interface
 * Farklı organization türleri bu interface'i implement eder
 */
export interface OrganizationAdapter extends BaseOrganizationAdapter {}

/**
 * Base member data interface
 * Used to store organization-specific member information
 * Child adapters can extend this with additional fields
 */
export interface MemberData {
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Organization details interface
 * Basic information about an organization
 */
export interface OrganizationDetails {
  uuid: string;
  name: string;
  logoSrc: string | null;
  ownerUuid: string;
}

/**
 * Organization member - generated from base DTO schema
 */
export type OrganizationMember = Static<typeof baseMemberObjectSchema>;

/**
 * Organization member details - generated from base DTO schema
 */
export type OrganizationMemberDetails = Static<typeof baseMemberDetailsObjectSchema>;

/**
 * Organization membership summary
 * Used for /me endpoint to show user's memberships across all organizations
 */
export interface OrganizationMembershipSummary {
  organization: {
    type: string;
    uuid: string;
    name: string;
    logoSrc: string | null;
  };
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date;
  membershipUpdatedAt: Date;
  roles: Array<{
    uuid: string;
    name: string;
    type: string;
    order: number;
  }>;
}
