import type { OrganizationType } from '@onlyjs/db/enums';
import type { BaseOrganizationAdapter } from '../base-adapter';

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
 * Organization member interface
 * Generic member representation for any organization type
 */
export interface OrganizationMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  image: string | null;
  isActive: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date;
  membershipUpdatedAt: Date;
  userCreatedAt: Date;
  roles: Array<{
    uuid: string;
    name: string;
    type: string;
    order: number;
    assignedAt: Date;
  }>;
}

/**
 * Detailed organization member interface
 * Extends OrganizationMember with additional details like permissions
 */
export interface OrganizationMemberDetails extends Omit<OrganizationMember, 'roles'> {
  gender: string;
  userUpdatedAt: Date;
  roles: Array<{
    uuid: string;
    name: string;
    description: string | null;
    type: string;
    order: number;
    permissions: unknown;
    assignedAt: Date;
  }>;
}

/**
 * Organization membership summary
 * Used for /me endpoint to show user's memberships across all organizations
 */
export interface OrganizationMembershipSummary {
  organization: {
    type: OrganizationType;
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
