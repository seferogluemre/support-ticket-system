/**
 * Company-Specific Permission Checks
 *
 * Project-specific check functions for company-related permissions and roles.
 */

import type { AuthMeResponse } from '#types/api';
import { OrganizationType, UserScope } from '#types/api';

/**
 * Check if user has company-level access (company scope)
 * @param session User session
 *
 * @example
 * ```ts
 * if (hasCompanyScope(session)) {
 *   // User is limited to company features
 * }
 * ```
 */
export function hasCompanyScope(session: AuthMeResponse | undefined): boolean {
  return session?.scope === UserScope.COMPANY;
}

/**
 * Check if user is company admin in any company
 * @param session User session
 *
 * @example
 * ```ts
 * if (hasAnyCompanyAdminRole(session)) {
 *   // User is admin in at least one company
 * }
 * ```
 */
export function hasAnyCompanyAdminRole(session: AuthMeResponse | undefined): boolean {
  if (!session?.organizationMemberships) return false;

  return session.organizationMemberships.some(
    (m) => m.organization.type === OrganizationType.COMPANY && (m.isAdmin || m.isOwner),
  );
}

/**
 * Check if user is company admin in specific company
 * @param session User session
 * @param companyUuid Company UUID
 *
 * @example
 * ```ts
 * if (isCompanyAdmin(session, companyUuid)) {
 *   // User is admin in this specific company
 * }
 * ```
 */
export function isCompanyAdmin(session: AuthMeResponse | undefined, companyUuid: string): boolean {
  if (!session?.organizationMemberships) return false;

  return session.organizationMemberships.some(
    (m) =>
      m.organization.type === OrganizationType.COMPANY &&
      m.organization.uuid === companyUuid &&
      (m.isAdmin || m.isOwner),
  );
}

/**
 * Check if user is company owner in specific company
 * @param session User session
 * @param companyUuid Company UUID
 *
 * @example
 * ```ts
 * if (isCompanyOwner(session, companyUuid)) {
 *   // User is owner of this specific company
 * }
 * ```
 */
export function isCompanyOwner(session: AuthMeResponse | undefined, companyUuid: string): boolean {
  if (!session?.organizationMemberships) return false;

  return session.organizationMemberships.some(
    (m) =>
      m.organization.type === OrganizationType.COMPANY &&
      m.organization.uuid === companyUuid &&
      m.isOwner,
  );
}

/**
 * Check if user is member of specific company (any role)
 * @param session User session
 * @param companyUuid Company UUID
 *
 * @example
 * ```ts
 * if (isCompanyMember(session, companyUuid)) {
 *   // User is member of this company
 * }
 * ```
 */
export function isCompanyMember(session: AuthMeResponse | undefined, companyUuid: string): boolean {
  if (!session?.organizationMemberships) return false;

  return session.organizationMemberships.some(
    (m) => m.organization.type === OrganizationType.COMPANY && m.organization.uuid === companyUuid,
  );
}

/**
 * Get all companies where user is a member
 * @param session User session
 * @returns Array of company UUIDs
 *
 * @example
 * ```ts
 * const companies = getUserCompanies(session);
 * // ['company-uuid-1', 'company-uuid-2']
 * ```
 */
export function getUserCompanies(session: AuthMeResponse | undefined): string[] {
  if (!session?.organizationMemberships) return [];

  return session.organizationMemberships
    .filter((m) => m.organization.type === OrganizationType.COMPANY)
    .map((m) => m.organization.uuid);
}

/**
 * Get all companies where user is an admin
 * @param session User session
 * @returns Array of company UUIDs
 *
 * @example
 * ```ts
 * const adminCompanies = getUserAdminCompanies(session);
 * // ['company-uuid-1', 'company-uuid-2']
 * ```
 */
export function getUserAdminCompanies(session: AuthMeResponse | undefined): string[] {
  if (!session?.organizationMemberships) return [];

  return session.organizationMemberships
    .filter((m) => m.organization.type === OrganizationType.COMPANY && (m.isAdmin || m.isOwner))
    .map((m) => m.organization.uuid);
}
