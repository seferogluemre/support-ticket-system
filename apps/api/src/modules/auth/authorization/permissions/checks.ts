import type { Role, User } from '@onlyjs/db/client';
import { ForbiddenException, UnauthorizedException } from '../../../../utils';
import { AUTH_BYPASS_ENABLED } from '../../../../config/auth.config';
import {
    expandWildcardPermissions,
    generateUserClaims,
    hasPermission,
    matchesWildcard,
} from '../claims/service';
import type { OrganizationType } from '@onlyjs/db/enums';
import type { PermissionIdentifier, PermissionKey } from './types';

/**
 * Permission runtime kontrolü
 * Bu dosya kullanıcı ve rol için runtime permission kontrolü yapar (Runtime checks)
 */

export function isPermissionGrantedToRole(role: Role, permission: PermissionIdentifier) {
  const permissions = role.permissions as PermissionKey[];
  const permissionKey = typeof permission === 'string' ? permission : permission.key;

  // Wildcard matching ile kontrol et
  return permissions.some((perm) => matchesWildcard(permissionKey, perm));
}

/**
 * Kullanıcının permission'a sahip olup olmadığını kontrol eder (Claim-based)
 * @param user Kullanıcı objesi
 * @param permission Kontrol edilecek permission
 * @param organizationUuid Opsiyonel: Organization UUID (güvenlik için)
 * @param organizationType Organization türü
 */
export async function isPermissionGrantedToUser(
  user: Pick<User, 'id'>,
  permission: PermissionIdentifier,
  organizationUuid?: string,
  organizationType?: OrganizationType,
): Promise<boolean> {
  if (!user?.id) {
    throw new UnauthorizedException();
  }

  // Auth bypass aktifse tüm permission'ları ver
  if (AUTH_BYPASS_ENABLED) {
    return true;
  }

  const permissionKey = typeof permission === 'string' ? permission : permission.key;
  const claims = await generateUserClaims(user.id);

  return hasPermission(claims, permissionKey, organizationUuid, organizationType);
}

export function ensureRoleHasPermission(role: Role, permission?: PermissionIdentifier | null) {
  if (!permission) return;
  if (!isPermissionGrantedToRole(role, permission)) {
    throw new ForbiddenException('Bu işlem için yetkiniz yok');
  }
}

/**
 * Kullanıcının permission'a sahip olup olmadığını kontrol eder ve yoksa hata fırlatır
 * @param user Kullanıcı objesi
 * @param permission Kontrol edilecek permission
 * @param organizationUuid Opsiyonel: Organization UUID (güvenlik için)
 * @param organizationType Organization türü
 */
export async function ensureUserHasPermission(
  user: Pick<User, 'id'>,
  permission?: PermissionIdentifier | null,
  organizationUuid?: string,
  organizationType?: OrganizationType,
) {
  if (!permission) return;

  // Auth bypass aktifse kontrolü atla
  if (AUTH_BYPASS_ENABLED) {
    return;
  }

  const userHasPermission = await isPermissionGrantedToUser(
    user,
    permission,
    organizationUuid,
    organizationType,
  );

  if (!userHasPermission) {
    throw new ForbiddenException('Bu işlem için yetkiniz yok');
  }
}

/**
 * Kullanıcının tüm permission'larını döndürür (Claim-based)
 * Wildcard'ları expand eder (UI için)
 * @param user Kullanıcı objesi
 */
export async function getUserPermissions(user: Pick<User, 'id'>): Promise<PermissionKey[]> {
  if (!user?.id) {
    throw new UnauthorizedException();
  }

  const claims = await generateUserClaims(user.id);

  // Wildcard'ları expand et - SADECE global scope'u olan permission'lar
  // organizationType: null → getPermissionsForOrganizationType(null) → global scope filter
  return expandWildcardPermissions(claims.global, null);
}

/**
 * Kullanıcının belirli bir organization için RAW permission'larını döndürür
 * Wildcard'ları expand ETMEden döndürür (internal kullanım için)
 * @param user Kullanıcı objesi
 * @param organizationUuid Organization UUID (güvenlik için)
 * @param organizationType Organization türü
 * @internal Use getUserOrganizationAwarePermissions for expanded permissions
 */
function getUserOrganizationPermissionsRaw(
  organizationUuid: string,
  organizationType: OrganizationType,
  claims: ReturnType<typeof generateUserClaims> extends Promise<infer T> ? T : never,
): PermissionKey[] {
  // Global permission'lar + organization-specific permission'lar (UUID kullanılıyor)
  const orgPermissions = claims.organizations[organizationType]?.[organizationUuid] || [];
  return [...new Set([...claims.global, ...orgPermissions])];
}

/**
 * Kullanıcının HERHANGİ BİR organization'da belirtilen permission'a sahip olup olmadığını kontrol eder
 * Frontend menü item'larını göstermek için kullanışlıdır
 *
 * @example
 * // User'ın herhangi bir organization'da posts:create yetkisi var mı?
 * const canCreatePost = await isAnyPermissionGrantedToUserOnAnyOrganization(user, 'posts:create', OrganizationType.COMPANY);
 * if (canCreatePost) {
 *   // "Create Post" menu item'ını göster
 * }
 */
export async function isAnyPermissionGrantedToUserOnAnyOrganization(
  user: Pick<User, 'id'>,
  permissions: PermissionIdentifier | PermissionIdentifier[],
  organizationType?: OrganizationType,
): Promise<boolean> {
  if (!user || !user.id) {
    return false;
  }

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const claims = await generateUserClaims(user.id);

  // Her permission için kontrol yap
  for (const permission of permissionArray) {
    const permissionKey = typeof permission === 'string' ? permission : permission.key;

    // 1. Global permission kontrolü (wildcard matching ile)
    if (claims.global.some((perm) => matchesWildcard(permissionKey, perm))) {
      return true;
    }

    // 2. Herhangi bir organization'da bu permission var mı kontrol et
    if (organizationType) {
      // Belirli bir organization type'da ara
      const orgsOfType = claims.organizations[organizationType];
      if (orgsOfType) {
        for (const orgPermissions of Object.values(orgsOfType)) {
          if (orgPermissions.some((perm) => matchesWildcard(permissionKey, perm))) {
            return true;
          }
        }
      }
    } else {
      // Tüm organization type'larında ara
      for (const orgsOfType of Object.values(claims.organizations)) {
        for (const orgPermissions of Object.values(orgsOfType)) {
          if (orgPermissions.some((perm) => matchesWildcard(permissionKey, perm))) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Kullanıcının belirli bir organization için organization-aware permission'larını döndürür
 * Wildcard'ları expand eder ve organization type'a göre filtreler
 *
 * @example
 * // Organization context'inde kullanıcının hangi yetkileri var?
 * const permissions = await getUserOrganizationAwarePermissions(user, 'org-uuid', OrganizationType.COMPANY);
 * // Returns: ['posts:create', 'posts:update'] (bu organization türü için izin verilmiş olanlar)
 */
export async function getUserOrganizationAwarePermissions(
  user: Pick<User, 'id'>,
  organizationUuid: string,
  organizationType: OrganizationType,
): Promise<PermissionKey[]> {
  if (!user || !user.id) {
    return [];
  }

  const claims = await generateUserClaims(user.id);

  // RAW permissions (wildcard'lı halde)
  const rawPerms = getUserOrganizationPermissionsRaw(organizationUuid, organizationType, claims);

  // Wildcard'ları expand et ve organization type'a göre filtrele
  return expandWildcardPermissions(rawPerms, organizationType);
}

/**
 * Kullanıcının belirli bir organization resource'una erişip erişemeyeceğini kontrol eder
 *
 * @example
 * // User bu organization'a erişebilir mi?
 * const canView = await canUserAccessOrganization(user, 'org-uuid', OrganizationType.COMPANY, PERMISSIONS.COMPANIES.SHOW);
 * if (!canView) {
 *   throw new ForbiddenException('Bu organization erişim yetkiniz yok');
 * }
 */
export async function canUserAccessOrganization(
  user: Pick<User, 'id'>,
  organizationUuid: string,
  organizationType: OrganizationType,
  requiredPermission: PermissionIdentifier,
): Promise<boolean> {
  if (!user || !user.id) {
    return false;
  }

  const claims = await generateUserClaims(user.id);
  const permissionKey =
    typeof requiredPermission === 'string' ? requiredPermission : requiredPermission.key;

  // 1. Global permission varsa tüm organization'lara erişebilir (wildcard matching ile)
  if (claims.global.some((perm) => matchesWildcard(permissionKey, perm))) {
    return true;
  }

  // 2. Bu organization'da herhangi bir yetkisi var mı kontrol et
  const orgPermissions = claims.organizations[organizationType]?.[organizationUuid];
  if (!orgPermissions || orgPermissions.length === 0) {
    return false;
  }

  // Herhangi bir permission varsa o organization'ı görüntüleyebilir
  return true;
}
