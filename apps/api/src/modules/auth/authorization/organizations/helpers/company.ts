import { OrganizationType } from '@onlyjs/db/enums';
import type { PermissionKey } from '../../permissions/types';
import {
  canAccessOrganization,
  ensureOrganizationPermission,
  getAccessibleOrganizationIds,
  getOrganizationWithAccessCheck,
  hasOrganizationPermission,
  isOrganizationMember,
} from './common';

/**
 * Company-specific authorization helpers
 * Bu helper'lar generic organization helper'larının company-specific kısayollarıdır
 * Tüm logic common.ts'de, burada sadece OrganizationType.COMPANY ile wrapper'lar var
 */

/**
 * Kullanıcının belirli bir company'ye erişim yetkisi olup olmadığını kontrol eder
 * - Global permission varsa: true
 * - Company member ise: true
 * - Değilse: false
 *
 * @param userId User ID
 * @param companyUuid Company UUID
 * @param globalPermission Global permission (e.g., "projects:list-all")
 * @returns true if user can access the company
 */
export async function canAccessCompany(
  userId: string,
  companyUuid: string,
  globalPermission: PermissionKey,
): Promise<boolean> {
  return canAccessOrganization(userId, companyUuid, OrganizationType.COMPANY, globalPermission);
}

/**
 * Kullanıcının erişebileceği company ID'lerini döndürür
 * - Global permission varsa: Tüm company'ler
 * - Değilse: Sadece üye olunan company'ler
 *
 * @param userId User ID
 * @param globalPermission Global permission (e.g., "projects:list-all")
 * @returns Array of accessible company IDs
 */
export async function getAccessibleCompanyIds(
  userId: string,
  globalPermission: PermissionKey,
): Promise<number[]> {
  return getAccessibleOrganizationIds(userId, OrganizationType.COMPANY, globalPermission);
}

/**
 * Kullanıcının belirli bir company'ye üye olup olmadığını kontrol eder
 *
 * @param userId User ID
 * @param companyUuid Company UUID
 * @returns true if user is member
 */
export async function isCompanyMember(userId: string, companyUuid: string): Promise<boolean> {
  return isOrganizationMember(userId, companyUuid, OrganizationType.COMPANY);
}

/**
 * Company UUID'den company bilgilerini getirir ve erişim kontrolü yapar
 *
 * @param companyUuid Company UUID
 * @param userId User ID
 * @param globalPermission Global permission for access check
 * @returns Company info (id, uuid)
 * @throws NotFoundException if company not found
 * @throws ForbiddenException if user cannot access
 */
export async function getCompanyWithAccessCheck(
  companyUuid: string,
  userId: string,
  globalPermission: PermissionKey,
): Promise<{ id: number; uuid: string }> {
  return getOrganizationWithAccessCheck(
    companyUuid,
    userId,
    OrganizationType.COMPANY,
    globalPermission,
  );
}

/**
 * Company'de belirli bir permission'a sahip olup olmadığını kontrol eder
 * Global VEYA company-specific permission kontrolü yapar
 *
 * @param userId User ID
 * @param companyUuid Company UUID
 * @param globalPermission Global permission (e.g., "projects:create")
 * @param companyPermission Company-specific permission (optional, defaults to globalPermission)
 * @returns true if user has permission
 */
export async function hasCompanyPermission(
  userId: string,
  companyUuid: string,
  globalPermission: PermissionKey,
  companyPermission?: PermissionKey,
): Promise<boolean> {
  return hasOrganizationPermission(
    userId,
    companyUuid,
    OrganizationType.COMPANY,
    globalPermission,
    companyPermission,
  );
}

/**
 * Company'de belirli bir permission'a sahip olup olmadığını kontrol eder ve yoksa hata fırlatır
 *
 * @param userId User ID
 * @param companyUuid Company UUID
 * @param globalPermission Global permission
 * @param companyPermission Company-specific permission (optional)
 * @param errorMessage Custom error message (optional)
 * @throws ForbiddenException if user doesn't have permission
 */
export async function ensureCompanyPermission(
  userId: string,
  companyUuid: string,
  globalPermission: PermissionKey,
  companyPermission?: PermissionKey,
  errorMessage?: string,
): Promise<void> {
  return ensureOrganizationPermission(
    userId,
    companyUuid,
    OrganizationType.COMPANY,
    globalPermission,
    companyPermission,
    errorMessage,
  );
}
