import { generateUserClaims, matchesWildcard, hasPermission } from '../../claims';
import type { PermissionKey } from '../../permissions/types';
import { OrganizationType } from '@onlyjs/db/enums';
import { AUTH_BYPASS_ENABLED } from '#config/auth.config';
import { organizationRegistry } from '../registry';
import type { OrganizationAdapter } from '../types';

/**
 * Organization Helper Functions
 *
 * Bu dosya organization ile ilgili ortak helper fonksiyonları içerir.
 * Tekrar eden kodları merkezileştirir ve kod tekrarını azaltır.
 */

/**
 * Kullanıcının belirli bir organization'daki permission'larını getirir (CACHED)
 * @param userId Kullanıcı ID
 * @param organizationId Organization ID
 * @param organizationType Organization türü
 */
export async function getUserPermissionsInOrganization(
  userId: string,
  organizationId: number,
  organizationType: OrganizationType,
): Promise<PermissionKey[] | null> {
  const adapter = organizationRegistry.get(organizationType);

  if (!adapter) {
    throw new Error(`Organization adapter not found for type: ${organizationType}`);
  }

  // UUID'yi al (cache'li)
  const organizationUuid = await adapter.getOrganizationUuid(organizationId);
  if (!organizationUuid) return null;

  // Claims'den permission kontrolü yap (cache'li)
  const claims = await generateUserClaims(userId);

  // Organization-specific permission'ları al
  const orgPermissions = claims.organizations[organizationType]?.[organizationUuid];
  if (!orgPermissions || orgPermissions.length === 0) return null;

  return orgPermissions;
}

/**
 * Belirli bir organization'da permission kontrolü (SADECE organization-specific, global kontrol YOK)
 * @param userId Kullanıcı ID
 * @param organizationId Organization ID
 * @param organizationType Organization türü
 * @param permission Kontrol edilecek permission
 */
export async function hasOrganizationSpecificPermission(
  userId: string,
  organizationId: number,
  organizationType: OrganizationType,
  permission: PermissionKey,
): Promise<boolean> {
  const adapter = organizationRegistry.get(organizationType);

  if (!adapter) {
    throw new Error(`Organization adapter not found for type: ${organizationType}`);
  }

  // UUID'yi al (cache'li)
  const organizationUuid = await adapter.getOrganizationUuid(organizationId);
  if (!organizationUuid) return false;

  // Claims'den permission kontrolü yap (cache'li)
  const claims = await generateUserClaims(userId);

  // Organization-specific permission kontrolü (global kontrol YOK)
  const orgPermissions = claims.organizations[organizationType]?.[organizationUuid];
  if (!orgPermissions || orgPermissions.length === 0) return false;

  // Wildcard kontrolü (organization-specific wildcard)
  return orgPermissions.some((perm) => matchesWildcard(permission, perm));
}

/**
 * 🔒 Kullanıcının belirli bir organization'a erişim yetkisi var mı kontrol eder
 * Security: Bu fonksiyon UUID-based authorization için kritiktir
 *
 * @param userId Kullanıcı ID
 * @param organizationUuid Organization UUID (güvenlik için)
 * @param organizationType Organization türü
 * @param requiredPermission Gerekli permission (opsiyonel)
 *
 * @returns true ise kullanıcı organization'a erişebilir
 *
 * @example
 * ```typescript
 * // Kullanıcı bu company'e erişebilir mi?
 * const canAccess = await validateUserAccessToOrganization(
 *   userId,
 *   'company-uuid-123',
 *   OrganizationType.COMPANY,
 *   'companies:show'
 * );
 * ```
 */
export async function validateUserAccessToOrganization(
  userId: string,
  organizationUuid: string,
  organizationType: OrganizationType,
  requiredPermission?: PermissionKey,
): Promise<boolean> {
  // Auth bypass aktifse erişime izin ver
  if (AUTH_BYPASS_ENABLED) {
    return true;
  }

  const claims = await generateUserClaims(userId);

  // 1. Global permission kontrolü (wildcard matching ile)
  if (requiredPermission) {
    if (claims.global.some((perm) => matchesWildcard(requiredPermission, perm))) {
      return true;
    }
  } else {
    // Permission belirtilmemişse, wildcard (*) varsa her şeye erişebilir
    if (claims.global.includes('*')) {
      return true;
    }
  }

  // 2. Organization-specific permission kontrolü
  const orgPermissions = claims.organizations[organizationType]?.[organizationUuid];

  // Organization'a ait permission kaydı yoksa erişim yok
  if (!orgPermissions) {
    return false;
  }

  // Organization'a ait permission kaydı varsa (boş bile olsa) kullanıcı member'dır
  // Permission belirtilmemişse, membership yeterli
  if (!requiredPermission) {
    return true;
  }

  // Permission belirtilmişse, o permission'ı kontrol et
  return orgPermissions.some((perm) => matchesWildcard(requiredPermission, perm));
}

/**
 * Organization ID'leri Set'ten Array'e çevirir ve boş olanları filtreler
 *
 * @param organizationIdsByType Organization type'a göre gruplanmış ID Set'leri
 * @returns Organization type'a göre gruplanmış ID Array'leri
 */
export function prepareOrganizationIdsForBatch(
  organizationIdsByType: Record<string, Set<number>>,
): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const [orgType, orgIds] of Object.entries(organizationIdsByType)) {
    if (orgIds.size > 0) {
      result[orgType] = Array.from(orgIds);
    }
  }

  return result;
}

/**
 * Organization permission'larını type'a göre gruplar
 *
 * @param permissions Permission listesi
 * @param organizationType Organization türü
 * @returns Organization type'a göre gruplanmış permission'lar
 */
export function groupPermissionsByOrganizationType(
  permissions: PermissionKey[],
  organizationType?: OrganizationType,
): Record<string, PermissionKey[]> {
  const result: Record<string, PermissionKey[]> = {};

  for (const permission of permissions) {
    // Organization type'a göre filtrele (eğer belirtilmişse)
    if (organizationType) {
      // Bu kısım permission key'lerin organization type'a göre filtrelenmesi için
      // Şu an için tüm permission'ları ekle, ileride permission key structure'ına göre filtrele
      if (!result[organizationType]) {
        result[organizationType] = [];
      }
      result[organizationType].push(permission);
    } else {
      // Global permission'lar için
      if (!result['global']) {
        result['global'] = [];
      }
      result['global'].push(permission);
    }
  }

  return result;
}

/**
 * Organization claims'den permission'ları çıkarır
 *
 * @param organizationClaims Organization claims objesi
 * @param organizationType Organization türü
 * @param organizationUuid Organization UUID
 * @returns Permission listesi
 */
export function extractPermissionsFromOrganizationClaims(
  organizationClaims: Record<string, Record<string, PermissionKey[]>>,
  organizationType: OrganizationType,
  organizationUuid: string,
): PermissionKey[] {
  return organizationClaims[organizationType]?.[organizationUuid] || [];
}

/**
 * Organization adapter'ını güvenli şekilde alır
 *
 * @param organizationType Organization türü
 * @returns Organization adapter veya null
 */
export function getOrganizationAdapter(
  organizationType: OrganizationType,
): OrganizationAdapter | null {
  return organizationRegistry.get(organizationType) || null;
}

/**
 * Organization adapter'ını zorunlu olarak alır (hata fırlatır)
 *
 * @param organizationType Organization türü
 * @returns Organization adapter
 * @throws Error eğer adapter bulunamazsa
 */
export function getRequiredOrganizationAdapter(
  organizationType: OrganizationType,
): OrganizationAdapter {
  const adapter = organizationRegistry.get(organizationType);
  if (!adapter) {
    throw new Error(`Organization adapter not found for type: ${organizationType}`);
  }
  return adapter;
}


/**
 * Permission'ların wildcard matching ile eşleşip eşleşmediğini kontrol eder
 *
 * @param permissions Permission listesi
 * @param targetPermission Hedef permission
 * @returns true ise eşleşme var
 */
export function hasPermissionMatch(
  permissions: PermissionKey[],
  targetPermission: PermissionKey,
): boolean {
  return permissions.some((permission) => matchesWildcard(targetPermission, permission));
}


/**
 * 🎯 GENERIC AUTHORIZATION HELPERS FOR SERVICE LAYER
 * Bu helper'lar service layer'da yetki kontrolü için kullanılır
 * Middleware'deki kontroller ile aynı mantığı kullanır
 */

/**
 * Kullanıcının belirli bir organization'a üye olup olmadığını kontrol eder
 * Organization registry kullanarak generic bir kontrol yapar
 *
 * @param userId User ID
 * @param organizationUuid Organization UUID
 * @param organizationType Organization type
 * @returns true if user is member
 */
export async function isOrganizationMember(
  userId: string,
  organizationUuid: string,
  organizationType: OrganizationType,
): Promise<boolean> {
  const adapter = organizationRegistry.get(organizationType);
  if (!adapter) {
    return false;
  }

  const organizationId = await adapter.getOrganizationId(organizationUuid);
  if (!organizationId) {
    return false;
  }

  return adapter.isMember(userId, organizationId);
}

/**
 * Kullanıcının bir organization'a erişim yetkisi olup olmadığını kontrol eder
 * - Global permission varsa: true
 * - Organization member ise: true
 * - Değilse: false
 *
 * @param userId User ID
 * @param organizationUuid Organization UUID
 * @param organizationType Organization type
 * @param globalPermission Global permission (e.g., "projects:list-all")
 * @returns true if user can access the organization
 */
export async function canAccessOrganization(
  userId: string,
  organizationUuid: string,
  organizationType: OrganizationType,
  globalPermission: PermissionKey,
): Promise<boolean> {
  const claims = await generateUserClaims(userId);

  // Check if user has global permission (includes system owner check via wildcard)
  if (
    matchesWildcard(globalPermission, '*' as PermissionKey) ||
    claims.global.some((perm) => matchesWildcard(globalPermission, perm))
  ) {
    return true;
  }

  // Check if user is member of this organization
  return isOrganizationMember(userId, organizationUuid, organizationType);
}

/**
 * Kullanıcının erişebileceği organization ID'lerini döndürür
 * - Global permission varsa: Tüm organization'lar
 * - Değilse: Sadece üye olunan organization'lar
 *
 * @param userId User ID
 * @param organizationType Organization type
 * @param globalPermission Global permission (e.g., "projects:list-all")
 * @returns Array of accessible organization IDs
 */
export async function getAccessibleOrganizationIds(
  userId: string,
  organizationType: OrganizationType,
  globalPermission: PermissionKey,
): Promise<number[]> {
  const claims = await generateUserClaims(userId);

  // Check if user has global permission
  const hasGlobalPermission = claims.global.some((perm) => matchesWildcard(globalPermission, perm));

  if (hasGlobalPermission) {
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      return [];
    }

    // Get all organizations of this type
    // Note: Bu method adapter'a eklenmeli, şimdilik company için özel implementation
    if (organizationType === OrganizationType.COMPANY) {
      const prisma = (await import('@onlyjs/db')).default;
      const companies = await prisma.company.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      return companies.map((c) => c.id);
    }

    return [];
  }

  // Get user's organizations via adapter
  const adapter = organizationRegistry.get(organizationType);
  if (!adapter) {
    return [];
  }

  // Get user memberships and extract organization IDs
  // Note: Bu method adapter'a eklenmeli, şimdilik company için özel implementation
  if (organizationType === OrganizationType.COMPANY) {
    const prisma = (await import('@onlyjs/db')).default;
    const members = await prisma.companyMember.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: { companyId: true },
    });
    return members.map((m) => m.companyId);
  }

  return [];
}

/**
 * Organization UUID'den organization bilgilerini getirir ve erişim kontrolü yapar
 *
 * @param organizationUuid Organization UUID
 * @param userId User ID
 * @param organizationType Organization type
 * @param globalPermission Global permission for access check
 * @returns Organization info (id, uuid)
 * @throws NotFoundException if organization not found
 * @throws ForbiddenException if user cannot access
 */
export async function getOrganizationWithAccessCheck(
  organizationUuid: string,
  userId: string,
  organizationType: OrganizationType,
  globalPermission: PermissionKey,
): Promise<{ id: number; uuid: string }> {
  const prisma = (await import('@onlyjs/db')).default;
  const { ForbiddenException, NotFoundException } = await import('../../../../../utils');

  const adapter = organizationRegistry.get(organizationType);
  if (!adapter) {
    throw new Error(`Organization adapter not found for type: ${organizationType}`);
  }

  // Get organization ID
  const organizationId = await adapter.getOrganizationId(organizationUuid);
  if (!organizationId) {
    throw new NotFoundException('Organization bulunamadı');
  }

  // Check access
  const canAccess = await canAccessOrganization(
    userId,
    organizationUuid,
    organizationType,
    globalPermission,
  );
  if (!canAccess) {
    throw new ForbiddenException("Bu organization'e erişim yetkiniz yok");
  }

  return { id: organizationId, uuid: organizationUuid };
}

/**
 * Organization'da belirli bir permission'a sahip olup olmadığını kontrol eder
 * Global VEYA organization-specific permission kontrolü yapar
 *
 * @param userId User ID
 * @param organizationUuid Organization UUID
 * @param organizationType Organization type
 * @param globalPermission Global permission (e.g., "projects:create")
 * @param orgPermission Organization-specific permission (optional, defaults to globalPermission)
 * @returns true if user has permission
 */
export async function hasOrganizationPermission(
  userId: string,
  organizationUuid: string,
  organizationType: OrganizationType,
  globalPermission: PermissionKey,
  orgPermission?: PermissionKey,
): Promise<boolean> {
  const claims = await generateUserClaims(userId);

  // Check global permission
  if (hasPermission(claims, globalPermission)) {
    return true;
  }

  // Check organization-specific permission
  const permToCheck = orgPermission || globalPermission;
  return hasPermission(claims, permToCheck, organizationUuid, organizationType);
}

/**
 * Organization'da belirli bir permission'a sahip olup olmadığını kontrol eder ve yoksa hata fırlatır
 *
 * @param userId User ID
 * @param organizationUuid Organization UUID
 * @param organizationType Organization type
 * @param globalPermission Global permission
 * @param orgPermission Organization-specific permission (optional)
 * @param errorMessage Custom error message (optional)
 * @throws ForbiddenException if user doesn't have permission
 */
export async function ensureOrganizationPermission(
  userId: string,
  organizationUuid: string,
  organizationType: OrganizationType,
  globalPermission: PermissionKey,
  orgPermission?: PermissionKey,
  errorMessage?: string,
): Promise<void> {
  const { ForbiddenException } = await import('../../../../../utils');

  const hasPermissionFlag = await hasOrganizationPermission(
    userId,
    organizationUuid,
    organizationType,
    globalPermission,
    orgPermission,
  );

  if (!hasPermissionFlag) {
    throw new ForbiddenException(errorMessage || 'Bu işlem için yetkiniz yok');
  }
}
