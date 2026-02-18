import type { OrganizationType } from '@onlyjs/db/enums';

/**
 * User membership cache structure (organization-agnostic)
 * Similar to User.roles structure in Prisma schema
 *
 * Example:
 * {
 *   organizationType: OrganizationType.COMPANY,
 *   organizationUuid: 'abc-123',
 *   isAdmin: true,
 *   joinedAt: '2024-01-01T00:00:00.000Z'
 * }
 */
export interface UserMembership {
  // Organization identification
  organizationType: OrganizationType;
  organizationUuid: string;
  
  // Common flags (only included when true to save space)
  isAdmin?: true;
  isOwner?: true;
  
  // Metadata
  joinedAt: string;
}
/**
 * Helper function to filter memberships by organization type
 * 
 * @example
 * const companies = filterMembershipsByType(memberships, OrganizationType.COMPANY);
 * const companyUuids = companies.map(m => m.organizationUuid);
 */
export function filterMembershipsByType(
  memberships: UserMembership[],
  organizationType: OrganizationType,
): UserMembership[] {
  return memberships.filter((m) => m.organizationType === organizationType);
}

/**
 * Helper function to get organization UUIDs from memberships
 * 
 * @example
 * const companyUuids = getOrganizationUuids(memberships, OrganizationType.COMPANY);
 */
export function getOrganizationUuids(
  memberships: UserMembership[],
  organizationType: OrganizationType,
): string[] {
  return filterMembershipsByType(memberships, organizationType).map((m) => m.organizationUuid);
}
