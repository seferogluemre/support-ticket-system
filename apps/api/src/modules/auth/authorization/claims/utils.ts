import type { PermissionKey } from '../permissions/types';
import { OrganizationType } from '@onlyjs/db/enums';

/**
 * Claims Utility Functions
 *
 * Bu dosya claims ve organization işlemleri için pure utility fonksiyonları içerir.
 * Circular import'u önlemek için bu fonksiyonlar hiçbir service'i import etmez.
 */

/**
 * Permission'ları Set'e ekler (duplicate'leri önler)
 *
 * @param targetSet Hedef Set
 * @param permissions Eklenecek permission'lar
 */
export function addPermissionsToSet(
  targetSet: Set<PermissionKey>,
  permissions: PermissionKey[],
): void {
  permissions.forEach((permission) => targetSet.add(permission));
}

/**
 * Permission'ları Set'ten çıkarır
 *
 * @param targetSet Hedef Set
 * @param permissions Çıkarılacak permission'lar
 */
export function removePermissionsFromSet(
  targetSet: Set<PermissionKey>,
  permissions: PermissionKey[],
): void {
  permissions.forEach((permission) => targetSet.delete(permission));
}

/**
 * Set'i Array'e çevirir ve sıralar
 *
 * @param permissionSet Permission Set'i
 * @returns Sıralı permission Array'i
 */
export function setToSortedArray(permissionSet: Set<PermissionKey>): PermissionKey[] {
  return Array.from(permissionSet).sort();
}

/**
 * Organization claims objesini temizler (boş olanları kaldırır)
 *
 * @param organizationClaims Organization claims objesi
 * @returns Temizlenmiş organization claims objesi
 */
export function cleanOrganizationClaims(
  organizationClaims: Record<string, Record<string, PermissionKey[]>>,
): Record<string, Record<string, PermissionKey[]>> {
  const result: Record<string, Record<string, PermissionKey[]>> = {};

  for (const [orgType, orgs] of Object.entries(organizationClaims)) {
    const cleanedOrgs: Record<string, PermissionKey[]> = {};

    for (const [orgUuid, permissions] of Object.entries(orgs)) {
      if (permissions.length > 0) {
        cleanedOrgs[orgUuid] = permissions;
      }
    }

    if (Object.keys(cleanedOrgs).length > 0) {
      result[orgType] = cleanedOrgs;
    }
  }

  return result;
}

/**
 * Role'ün organization-specific olup olmadığını kontrol eder
 * @param role Role objesi
 * @returns true ise role organization-specific'tir
 */
export function isOrganizationRole(role: {
  organizationType: OrganizationType | null;
  organizationId: number | null;
}): role is {
  organizationType: OrganizationType;
  organizationId: number;
} {
  return (
    Object.values(OrganizationType).includes(role.organizationType as OrganizationType) &&
    role.organizationId !== null &&
    role.organizationId !== undefined
  );
}

/**
 * Organization context'ini string olarak formatlar
 *
 * @param organizationType Organization türü
 * @param organizationId Organization ID
 * @returns Formatlanmış string
 */
export function formatOrganizationContext(
  organizationType: OrganizationType | null,
  organizationId: number | null,
): string {
  if (organizationType && organizationId) {
    return `${organizationType}:${organizationId}`;
  }
  return 'global';
}

/**
 * Organization UUID'yi string olarak formatlar
 *
 * @param organizationType Organization türü
 * @param organizationUuid Organization UUID
 * @returns Formatlanmış string
 */
export function formatOrganizationUuid(
  organizationType: OrganizationType,
  organizationUuid: string,
): string {
  return `${organizationType}:${organizationUuid}`;
}
