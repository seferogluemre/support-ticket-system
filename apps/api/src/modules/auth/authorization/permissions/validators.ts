import { BadRequestException } from '#utils';
import { OrganizationType } from '@onlyjs/db/enums';
import { PERMISSION_GROUPS, PERMISSIONS } from './constants';
import type { GenericPermissionObject, PermissionKey, PermissionScope } from './types';

/**
 * Permission metadata ve validation utilities
 * Bu dosya permission'ların organizasyon uyumluluğunu kontrol eder (Setup-time)
 */

/**
 * Tüm permission objelerini flat list olarak döndürür (cache için)
 */
const getAllPermissionObjects = (() => {
  let cache: GenericPermissionObject[] | null = null;
  return () => {
    if (!cache) {
      cache = Object.values(PERMISSIONS).flatMap((module) => Object.values(module));
    }
    return cache;
  };
})();

/**
 * Permission key'e göre permission objesini bulur
 */
function findPermissionObject(permissionKey: PermissionKey): GenericPermissionObject | undefined {
  return getAllPermissionObjects().find((perm) => perm.key === permissionKey);
}

/**
 * Permission'ın belirli bir scope'ta (global veya organization türü) kullanılıp kullanılamayacağını kontrol eder
 * @param permissionKey Permission key
 * @param organizationType Organization türü (null = GLOBAL)
 * @returns true: kullanılabilir, false: kullanılamaz
 */
export function isPermissionAllowedForOrganizationType(
  permissionKey: PermissionKey,
  organizationType: OrganizationType | null,
): boolean {
  // Global wildcard her zaman izinli
  if (permissionKey === '*') return true;

  // Group wildcard kontrolü (e.g., "user-basic:*", "posts:*")
  // ⚠️ Group wildcard'ları validation sırasında KABUL ET
  // Runtime'da permission check yapılırken wildcard expand edilip kontrol edilecek
  if (permissionKey.endsWith(':*')) {
    const groupKey = permissionKey.slice(0, -2); // Remove ":*"
    const group = Object.values(PERMISSION_GROUPS).find((g) => g.key === groupKey);

    // Group geçerliyse kabul et (içindeki permission'lar runtime'da kontrol edilecek)
    return !!group;
  }

  // Permission objesini bul
  const permissionObj = findPermissionObject(permissionKey);
  if (!permissionObj) return false;

  // Scopes kontrolü
  if (!permissionObj.scopes || permissionObj.scopes.length === 0) {
    // Scopes tanımlı değilse hata - artık zorunlu!
    throw new Error(`Permission ${permissionKey} has no scopes defined!`);
  }

  const targetScope = organizationType || 'global';
  return permissionObj.scopes.includes(targetScope);
}

/**
 * Belirli bir organization türü için kullanılabilir permission'ları döndürür
 * @param organizationType Organization türü (null = GLOBAL)
 * @returns Permission key listesi
 */
export function getPermissionsForOrganizationType(
  organizationType: OrganizationType | null,
): PermissionKey[] {
  return getAllPermissionObjects()
    .map((perm) => perm.key as PermissionKey)
    .filter((key) => isPermissionAllowedForOrganizationType(key, organizationType));
}

/**
 * Permission grubunu organization türüne göre filtreler
 * Frontend'de organization türüne göre dinamik permission listesi göstermek için kullanılır
 * @param organizationType Organization türü (null = GLOBAL)
 * @returns Filtrelenmiş permission grupları
 */
export function getFilteredPermissionGroups(organizationType: OrganizationType | null) {
  const filtered: Record<
    string,
    { key: string; description: string; permissions: GenericPermissionObject[] }
  > = {};

  for (const [groupKey, group] of Object.entries(PERMISSION_GROUPS)) {
    const filteredPermissions = group.permissions.filter((perm) =>
      isPermissionAllowedForOrganizationType(perm.key as PermissionKey, organizationType),
    );

    if (filteredPermissions.length > 0) {
      filtered[groupKey] = {
        key: group.key,
        description: group.description,
        permissions: filteredPermissions as GenericPermissionObject[],
      };
    }
  }

  return filtered;
}

/**
 * Permission'ın organization-specific rollerde kullanılabilir olup olmadığını kontrol eder
 * @param permissionKey Permission key
 * @returns true: organization-specific rollerde kullanılabilir, false: sadece global
 * @throws Error Permission bulunamazsa veya scopes tanımlı değilse
 */
export function isOrganizationAwarePermission(permissionKey: PermissionKey): boolean {
  if (permissionKey === '*') return true;

  // Group wildcard kontrolü
  if (permissionKey.endsWith(':*')) {
    const groupKey = permissionKey.slice(0, -2);
    const group = Object.values(PERMISSION_GROUPS).find((g) => g.key === groupKey);

    if (!group) {
      throw new Error(`Permission group ${groupKey} not found!`);
    }

    // Group'taki HERHANGİ BİR permission organization-aware ise group da organization-aware
    return group.permissions.some((perm) =>
      isOrganizationAwarePermission(perm.key as PermissionKey),
    );
  }

  const permissionObj = findPermissionObject(permissionKey);

  if (!permissionObj) {
    throw new Error(`Permission ${permissionKey} not found!`);
  }

  if (!permissionObj.scopes || permissionObj.scopes.length === 0) {
    throw new Error(`Permission ${permissionKey} has no scopes defined!`);
  }

  // 'global' dışında en az bir scope varsa organization-aware
  return permissionObj.scopes.some((scope) => scope !== 'global');
}

/**
 * Permission için izin verilen scope'ları döndürür
 * @param permissionKey Permission key
 * @returns Scope listesi (['global'], [OrganizationType.COMPANY], vb.)
 * @throws Error Permission bulunamazsa veya scopes tanımlı değilse
 */
export function getAllowedScopes(permissionKey: PermissionKey): string[] {
  if (permissionKey === '*') return ['global', OrganizationType.COMPANY]; // Wildcard tüm scope'larda kullanılabilir

  // Group wildcard kontrolü
  if (permissionKey.endsWith(':*')) {
    const groupKey = permissionKey.slice(0, -2);
    const group = Object.values(PERMISSION_GROUPS).find((g) => g.key === groupKey);

    if (!group) {
      throw new Error(`Permission group ${groupKey} not found!`);
    }

    // Group'taki tüm permission'ların ortak scope'larını bul
    const allScopes = group.permissions.flatMap((perm) =>
      getAllowedScopes(perm.key as PermissionKey),
    );

    // Unique scope'ları döndür
    return [...new Set(allScopes)];
  }

  const permissionObj = findPermissionObject(permissionKey);

  if (!permissionObj) {
    throw new Error(`Permission ${permissionKey} not found!`);
  }

  if (!permissionObj.scopes || permissionObj.scopes.length === 0) {
    throw new Error(`Permission ${permissionKey} has no scopes defined!`);
  }

  return permissionObj.scopes;
}

/**
 * Permission listesinin organization türü için geçerli olup olmadığını kontrol eder ve hata fırlatır
 * @param permissions Permission key listesi
 * @param organizationType Organization türü (null = GLOBAL)
 * @throws BadRequestException Geçersiz permission varsa
 */
export function validatePermissionsForOrganizationType(
  permissions: PermissionKey[],
  organizationType: OrganizationType | null,
): void {
  // Wildcard kontrolü
  if (permissions.includes('*') && permissions.length > 1) {
    throw new BadRequestException('Wildcard (*) yetkisi tek başına kullanılmalıdır');
  }

  // Wildcard varsa diğer kontrolleri atlayalım
  if (permissions.includes('*')) return;

  // Her permission'ın bu organization türünde kullanılabilir olduğunu kontrol et
  const invalidPermissions = permissions.filter(
    (perm) => !isPermissionAllowedForOrganizationType(perm, organizationType),
  );

  if (invalidPermissions.length > 0) {
    const orgTypeLabel = organizationType || 'GLOBAL';
    throw new BadRequestException(
      `Şu yetkiler ${orgTypeLabel} rolünde kullanılamaz: ${invalidPermissions.join(', ')}`,
    );
  }
}

/**
 * Permission'ın belirli bir scope'ta UI'da gizli olup olmadığını kontrol eder
 * @param permissionKey Permission key
 * @param scope Kontrol edilecek scope (global, company, vb.)
 * @returns true: gizli, false: görünür
 */
export function isPermissionHiddenInScope(
  permissionKey: PermissionKey,
  scope: PermissionScope,
): boolean {
  if (permissionKey === '*') return false; // Wildcard her zaman görünür

  // Group wildcard kontrolü - group'taki TÜM permission'lar gizliyse gizli
  if (permissionKey.endsWith(':*')) {
    const groupKey = permissionKey.slice(0, -2);
    const group = Object.values(PERMISSION_GROUPS).find((g) => g.key === groupKey);

    if (!group) return false;

    // Group'taki tüm permission'lar gizliyse gizli
    return group.permissions.every((perm) =>
      isPermissionHiddenInScope(perm.key as PermissionKey, scope),
    );
  }

  const permissionObj = findPermissionObject(permissionKey);
  if (!permissionObj || !permissionObj.hiddenOn) return false;

  // Boolean ise tüm scope'larda gizli
  if (typeof permissionObj.hiddenOn === 'boolean') {
    return permissionObj.hiddenOn;
  }

  // Array ise sadece belirtilen scope'larda gizli
  return permissionObj.hiddenOn.includes(scope);
}
