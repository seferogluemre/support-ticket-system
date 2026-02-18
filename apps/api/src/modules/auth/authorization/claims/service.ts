import { cache, KVStoreService } from '#core';
import prisma from '@onlyjs/db';
import { Prisma } from '@onlyjs/db/client';
import { AUTH_KV_KEYS, AUTH_KV_NAMESPACE } from '../constants';
import { organizationRegistry } from '../organizations';
import { OrganizationType } from '@onlyjs/db/enums';
import { PERMISSION_KEYS } from '../permissions/constants';
import type { PermissionKey } from '../permissions/types';
import {
  getPermissionsForOrganizationType,
  isPermissionAllowedForOrganizationType,
} from '../permissions/validators';
import type { UserClaims, UserRoleInfo } from './types';
import {
  addPermissionsToSet,
  cleanOrganizationClaims,
  isOrganizationRole,
} from './utils';

const CLAIMS_CACHE_KEY = (userId: string) => `user:${userId}:claims`;

/**
 * Wildcard permission matching (optimized)
 * @param permission Permission to check (e.g., "users:show")
 * @param wildcard Wildcard pattern (e.g., "*", "users:*")
 * @returns true if permission matches the wildcard pattern
 */
export function matchesWildcard(permission: PermissionKey, wildcard: PermissionKey): boolean {
  // Fast path: Global wildcard (most common case for full access)
  if (wildcard === '*') return true;

  // Fast path: Exact match
  if (wildcard === permission) return true;

  // Prefix wildcard (e.g., "users:*" matches "users:show")
  // Optimization: Check if it's a wildcard pattern before slicing
  if (wildcard.length > 2 && wildcard.endsWith(':*')) {
    const prefix = wildcard.slice(0, -1); // Remove "*" (keep ":")
    return permission.startsWith(prefix);
  }

  return false;
}

/**
 * In-memory cache for wildcard expansion results
 * Key format: "wildcard|orgType" (e.g., "*|company", "users:*|null")
 */
const wildcardExpansionCache = new Map<string, PermissionKey[]>();

/**
 * Clear wildcard expansion cache
 * Called automatically:
 * - On app restart (in-memory cache)
 * - Via admin endpoint (manual)
 *
 * Rarely needed since permissions are statically defined
 * @internal
 */
export function clearWildcardCache(): void {
  const size = wildcardExpansionCache.size;
  wildcardExpansionCache.clear();

  // Log cache clear event (admin action)
  if (size > 0) {
    // biome-ignore lint/suspicious/noConsole: Admin action logging
    console.info(`🧹 Wildcard expansion cache cleared (${size} entries)`);
  }
}

/**
 * Expand a single wildcard to matching permissions (memoized)
 * @param wildcard Single wildcard pattern
 * @param organizationType Organization type filter
 * @returns Array of matching permissions
 */
function expandSingleWildcard(
  wildcard: PermissionKey,
  organizationType?: OrganizationType | null,
): PermissionKey[] {
  // Create cache key
  const cacheKey = `${wildcard}|${organizationType ?? 'null'}`;

  // Check cache
  const cached = wildcardExpansionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Get all possible permissions to check against
  const allPermissions =
    organizationType !== undefined
      ? getPermissionsForOrganizationType(organizationType)
      : PERMISSION_KEYS;

  // Find matching permissions
  const matches = allPermissions.filter((perm) => matchesWildcard(perm, wildcard));

  // Cache result
  wildcardExpansionCache.set(cacheKey, matches);

  return matches;
}

/**
 * Expand wildcard permissions to actual permissions list
 * Optionally filtered by organization type
 * @param wildcardPermissions Permissions with wildcards (e.g., ["*", "users:*", "posts:show"])
 * @param organizationType Organization type to filter by (null for global)
 * @returns Expanded permission list
 */
export function expandWildcardPermissions(
  wildcardPermissions: PermissionKey[],
  organizationType?: OrganizationType | null,
): PermissionKey[] {
  const expanded = new Set<PermissionKey>();

  // Expand each wildcard and merge results
  for (const wildcardPerm of wildcardPermissions) {
    const matches = expandSingleWildcard(wildcardPerm, organizationType);
    matches.forEach((perm) => expanded.add(perm));
  }

  return Array.from(expanded);
}

/**
 * 🎯 OPTIMIZATION HELPER
 * Permission set'i optimize eder - wildcard varsa diğer permission'ları temizler
 *
 * Mantık:
 * - "*" varsa: SADECE "*" kalır
 * - "users:*" varsa: "users:show", "users:create" gibi permission'lar kaldırılır
 * - Hem wildcard hem specific permission'lar gereksiz, sadece wildcard yeterli
 *
 * @param permissions Permission set'i
 * @returns Optimize edilmiş permission set'i
 */
function optimizePermissionSet(permissions: Set<PermissionKey>): Set<PermissionKey> {
  // Full wildcard varsa sadece onu tut
  if (permissions.has('*' as PermissionKey)) {
    return new Set<PermissionKey>(['*' as PermissionKey]);
  }

  // Wildcard pattern'leri bul (örn: users:*, posts:*)
  const wildcards = Array.from(permissions).filter((p) => p.endsWith(':*'));

  if (wildcards.length === 0) {
    return permissions; // Wildcard yok, olduğu gibi dön
  }

  // Her wildcard için, match eden specific permission'ları kaldır
  const optimized = new Set<PermissionKey>(permissions);

  for (const wildcard of wildcards) {
    const prefix = wildcard.slice(0, -1); // "users:*" -> "users:"

    // Wildcard ile match eden tüm permission'ları bul ve kaldır
    for (const perm of permissions) {
      if (perm !== wildcard && perm.startsWith(prefix)) {
        optimized.delete(perm);
      }
    }
  }

  return optimized;
}

/**
 * Kullanıcının tüm claim'lerini oluşturur (hem global hem organization bazlı)
 * Bu fonksiyon RBAC (role-based) ve CBAC (claim-based) yetkilerini birleştirir
 *
 * Önce DB'deki cached claim'leri kontrol eder, yoksa yeniden hesaplar
 */
export async function generateUserClaims(userId: string): Promise<UserClaims> {
  // 1. Memory cache kontrolü
  const cachedClaims = await cache.get<UserClaims>(CLAIMS_CACHE_KEY(userId));
  if (cachedClaims) {
    return cachedClaims;
  }

  // 2. DB'deki cached claims'i kontrol et
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { claims: true, roles: true },
  });

  if (user?.claims) {
    const dbClaims = user.claims as unknown as UserClaims;
    // Memory cache'e de kaydet - TTL: 1 saat
    await cache.set(CLAIMS_CACHE_KEY(userId), dbClaims, 3600);
    return dbClaims;
  }

  // 3. Claim'ler yoksa hesapla
  // ✨ Performance: Eğer roles cache'de varsa (claims null ama roles var), tekrar hesaplamaya gerek yok
  const cachedRoles = user?.roles as UserRoleInfo[] | null;
  const result = await calculateUserClaims(userId, cachedRoles);

  // 4. DB'ye ve cache'e kaydet (both claims + roles)
  await saveUserClaims(userId, result);

  return result.claims;
}

/**
 * Kullanıcının claim'lerini sıfırdan hesaplar
 * Returns: { claims, roles } - roles kaydedilecek ayrı field'a
 *
 * @param userId - User ID
 * @param cachedRoles - user.roles field'ından gelen cache (eğer role permissions değişti ama roller atanmadı/kaldırılmadıysa mevcut)
 *
 * ✨ Performance Optimization:
 * - Role permissions değiştiğinde: SADECE claims invalidate edilir, roles korunur
 * - cachedRoles varsa: Role info'yu tekrar hesaplamaya gerek yok, sadece permissions hesaplanır
 * - cachedRoles yoksa: Hem roller hem permissions hesaplanır (role assignment değişmiş demektir)
 */
async function calculateUserClaims(
  userId: string,
  cachedRoles?: UserRoleInfo[] | null,
): Promise<{ claims: UserClaims; roles: UserRoleInfo[] }> {
  const globalClaims = new Set<PermissionKey>();
  const organizationClaims: Record<string, Record<string, Set<PermissionKey>>> = {};

  // ✨ Performance Boost: Eğer roles zaten cache'de varsa, sadece permissions'ları hesapla
  let roleInfos: UserRoleInfo[] = cachedRoles || [];
  let needRoleInfoRecalculation = !cachedRoles || cachedRoles.length === 0;

  // 1. Kullanıcının tüm rollerini al (role bilgileriyle birlikte)
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        select: {
          uuid: true,
          name: true,
          permissions: true,
          organizationType: true,
          organizationId: true,
        },
      },
    },
  });

  // Eğer DB'den gelen rol sayısı cache'deki ile farklıysa, role info'yu yeniden hesapla
  if (cachedRoles && userRoles.length !== cachedRoles.length) {
    needRoleInfoRecalculation = true;
    roleInfos = [];
  }

  // UUID mappings for organization-specific roles (batch query)
  const roleOrgIdsByType: Record<string, Set<number>> = {};
  for (const userRole of userRoles) {
    if (userRole.role && isOrganizationRole(userRole.role)) {
      const orgType = userRole.role.organizationType;
      if (!roleOrgIdsByType[orgType]) {
        roleOrgIdsByType[orgType] = new Set();
      }
      roleOrgIdsByType[orgType].add(userRole.role.organizationId);
    }
  }

  // Get UUID mappings in parallel using batch service
  const roleOrgUuidMappings: Record<string, Record<number, string>> = {};
  if (Object.keys(roleOrgIdsByType).length > 0) {
    // Batch UUID mapping için organization registry'yi kullan
    await Promise.all(
      Object.entries(roleOrgIdsByType).map(async ([orgType, orgIds]) => {
        const adapter = organizationRegistry.get(orgType as OrganizationType);
        if (adapter && orgIds.size > 0) {
          const idArray = Array.from(orgIds);
          roleOrgUuidMappings[orgType] = await adapter.getOrganizationUuids(idArray);
        }
      }),
    );
  }

  // Process roles
  for (const userRole of userRoles) {
    if (!userRole.role) continue;

    const role = userRole.role;
    const rolePermissions = role.permissions as PermissionKey[];

    // ✨ Role info hesaplama (sadece gerekirse)
    if (needRoleInfoRecalculation) {
      // Add to roleInfos (minimal info only: uuid + org info)
      // Frontend can fetch full role details by UUID if needed
      if (isOrganizationRole(role)) {
        const orgType = role.organizationType;
        const organizationUuid = roleOrgUuidMappings[orgType]?.[role.organizationId];
        if (organizationUuid) {
          roleInfos.push({
            uuid: role.uuid,
            organizationType: orgType,
            organizationUuid,
          });
        } else {
          // UUID mapping failed, skip organization fields
          // eslint-disable-next-line no-console
          console.warn(
            `UUID mapping failed for role ${role.uuid} (${orgType}:${role.organizationId})`,
          );
          roleInfos.push({
            uuid: role.uuid,
          });
        }
      } else {
        // Global role - no organization fields
        roleInfos.push({
          uuid: role.uuid,
        });
      }
    }

    // Global rol: organizationType null olan roller
    if (role.organizationType === null) {
      // Wildcard'ları olduğu gibi sakla (expand etme)
      addPermissionsToSet(globalClaims, rolePermissions);
    }
  }

  // 🎯 OPTIMIZATION: Global scope wildcard cleanup (group patterns dahil)
  const optimizedGlobal = optimizePermissionSet(globalClaims);
  globalClaims.clear();
  optimizedGlobal.forEach((p) => globalClaims.add(p));

  // 2. Organization bazlı permission'lar (UserRole tablosundan direkt)
  // Organization-specific role'leri işle
  for (const userRole of userRoles) {
    if (!userRole.role) continue;

    const role = userRole.role;
    const rolePermissions = role.permissions as PermissionKey[];

    // Organization-specific rol: organizationType ve organizationId var
    if (isOrganizationRole(role)) {
      const orgType = role.organizationType;
      const organizationUuid = roleOrgUuidMappings[orgType]?.[role.organizationId];
      if (organizationUuid) {
        if (!organizationClaims[orgType]) {
          organizationClaims[orgType] = {};
        }
        if (!organizationClaims[orgType][organizationUuid]) {
          organizationClaims[orgType][organizationUuid] = new Set<PermissionKey>();
        }

        // Permission'ları ekle
        addPermissionsToSet(organizationClaims[orgType][organizationUuid], rolePermissions);

        // 🎯 OPTIMIZATION: Wildcard cleanup
        organizationClaims[orgType][organizationUuid] = optimizePermissionSet(
          organizationClaims[orgType][organizationUuid],
        );
      }
    }
  }

  // 3. Doğrudan kullanıcı permission'ları (UserPermission tablosu)
  const directPermissions = await prisma.userPermission.findMany({
    where: { userId },
    select: {
      permissionCode: true,
      organizationType: true,
      organizationId: true,
    },
  });

  // organizationType'a göre groupla ve UUID mapping için batch query yap
  const orgIdsByType: Record<string, Set<number>> = {};

  for (const perm of directPermissions) {
    if (isOrganizationRole(perm)) {
      const orgType = perm.organizationType;
      if (!orgIdsByType[orgType]) {
        orgIdsByType[orgType] = new Set();
      }
      orgIdsByType[orgType].add(perm.organizationId);
    }
  }

  // Tüm organization ID'leri için UUID mapping'i al (paralel)
  const uuidMappings: Record<string, Record<number, string>> = {};
  if (Object.keys(orgIdsByType).length > 0) {
    await Promise.all(
      Object.entries(orgIdsByType).map(async ([orgType, orgIds]) => {
        const adapter = organizationRegistry.get(orgType as OrganizationType);
        if (adapter && orgIds.size > 0) {
          const idArray = Array.from(orgIds);
          uuidMappings[orgType] = await adapter.getOrganizationUuids(idArray);
        }
      }),
    );
  }

  // 4. 🔒 OWNER WILDCARD CHECK & OPTIMIZATION
  // Kullanıcının owner olduğu organization'ları bul ve wildcard ekle
  // Owner organizations için gereksiz permission eklemeyi atla

  // Önce unique organization listesi oluştur
  const uniqueOrganizations = new Map<string, Set<string>>();

  // Roles'den gelen organization'ları topla
  for (const [orgType, orgs] of Object.entries(organizationClaims)) {
    if (!uniqueOrganizations.has(orgType)) {
      uniqueOrganizations.set(orgType, new Set());
    }
    for (const orgUuid of Object.keys(orgs)) {
      uniqueOrganizations.get(orgType)!.add(orgUuid);
    }
  }

  // Direct permissions'dan gelen organization'ları da ekle
  for (const [orgType, mapping] of Object.entries(uuidMappings)) {
    if (!uniqueOrganizations.has(orgType)) {
      uniqueOrganizations.set(orgType, new Set());
    }
    for (const orgUuid of Object.values(mapping)) {
      uniqueOrganizations.get(orgType)!.add(orgUuid);
    }
  }

  // Owner organizations'ı track et (daha sonra permission eklemeyi atlamak için)
  const ownerOrganizations = new Set<string>(); // Format: "orgType:orgUuid"

  // Owner kontrollerini paralel yap
  const ownerChecks = Array.from(uniqueOrganizations.entries()).flatMap(([orgType, orgUuids]) =>
    Array.from(orgUuids).map(async (orgUuid) => {
      try {
        const adapter = organizationRegistry.get(orgType as OrganizationType);
        if (!adapter) return;

        const isOwner = await adapter.isOwner(userId, orgUuid);
        if (isOwner) {
          // Owner olarak işaretle
          ownerOrganizations.add(`${orgType}:${orgUuid}`);

          // Owner ise SADECE wildcard (*) ekle, diğer permission'ları temizle
          if (!organizationClaims[orgType]) {
            organizationClaims[orgType] = {};
          }
          // Mevcut permission'ları temizle ve sadece wildcard ekle
          organizationClaims[orgType][orgUuid] = new Set<PermissionKey>(['*' as PermissionKey]);
        }
      } catch (error) {
        console.error(`Owner check failed for ${orgType}:${orgUuid}`, error);
      }
    }),
  );

  await Promise.all(ownerChecks);

  // Permission'ları claim'lere ekle (owner organizations'ı atla)
  for (const perm of directPermissions) {
    // Global permission: organizationType null
    if (!perm.organizationType) {
      // 🎯 OPTIMIZATION: Global wildcard varsa gereksiz permission ekleme atla
      if (globalClaims.has('*' as PermissionKey)) {
        continue; // Full wildcard zaten var, ekleme
      }

      globalClaims.add(perm.permissionCode as PermissionKey);

      // Wildcard/pattern eklendiyse optimize et
      if (perm.permissionCode === '*' || perm.permissionCode.endsWith(':*')) {
        const optimized = optimizePermissionSet(globalClaims);
        globalClaims.clear();
        optimized.forEach((p) => globalClaims.add(p));
      }
    }
    // Organization-specific permission
    else {
      if (isOrganizationRole(perm)) {
        const orgType = perm.organizationType;
        const orgUuid = uuidMappings[orgType]?.[perm.organizationId];

        if (!orgUuid) {
          // eslint-disable-next-line no-console
          console.warn(`UUID not found for ${orgType} ID ${perm.organizationId}`);
          continue;
        }

        // 🎯 OPTIMIZATION: Owner organization ise permission eklemeyi atla
        const orgKey = `${orgType}:${orgUuid}`;
        if (ownerOrganizations.has(orgKey)) {
          continue; // Owner zaten wildcard'a sahip, gereksiz permission ekleme
        }

        if (!organizationClaims[orgType]) {
          organizationClaims[orgType] = {};
        }

        if (!organizationClaims[orgType][orgUuid]) {
          organizationClaims[orgType][orgUuid] = new Set<PermissionKey>();
        }

        // 🎯 OPTIMIZATION: Organization wildcard varsa gereksiz permission ekleme atla
        if (organizationClaims[orgType][orgUuid].has('*' as PermissionKey)) {
          continue; // Full wildcard zaten var, ekleme
        }

        addPermissionsToSet(organizationClaims[orgType][orgUuid], [
          perm.permissionCode as PermissionKey,
        ]);

        // Wildcard/pattern eklendiyse optimize et
        if (perm.permissionCode === '*' || perm.permissionCode.endsWith(':*')) {
          organizationClaims[orgType][orgUuid] = optimizePermissionSet(
            organizationClaims[orgType][orgUuid],
          );
        }
      }
    }
  }

  // 🔒 SYSTEM OWNER CHECK
  // System owner'ı KV store'dan al ve kontrol et
  // Bu kontrolü en son yapıyoruz çünkü roleInfos'u hesaplamamız gerekiyor
  const systemOwnerUuid = await KVStoreService.get<string>(
    AUTH_KV_KEYS.SYSTEM_OWNER,
    AUTH_KV_NAMESPACE,
  );

  if (systemOwnerUuid && systemOwnerUuid === userId) {
    // System owner ise direkt wildcard döndür (roleInfos'u koru)
    return {
      claims: {
        global: ['*' as PermissionKey],
        organizations: {},
      },
      roles: roleInfos,
    };
  }

  // Sonuç oluştur (UUID-keyed) ve temizle
  const organizations = cleanOrganizationClaims(
    Object.fromEntries(
      Object.entries(organizationClaims).map(([orgType, orgs]) => [
        orgType,
        Object.fromEntries(
          Object.entries(orgs).map(([orgUuid, permissions]) => [orgUuid, Array.from(permissions)]),
        ),
      ]),
    ),
  );

  return {
    claims: {
      global: Array.from(globalClaims),
      organizations,
    },
    roles: roleInfos,
  };
}

/**
 * Kullanıcının claim'lerini ve rollerini DB'ye ve cache'e kaydeder
 */
async function saveUserClaims(
  userId: string,
  data: { claims: UserClaims; roles: UserRoleInfo[] },
): Promise<void> {
  // DB'ye kaydet (claims + roles ayrı field'larda)
  await prisma.user.update({
    where: { id: userId },
    data: {
      claims: data.claims as unknown as Prisma.InputJsonValue,
      roles: data.roles as unknown as Prisma.InputJsonValue,
    },
  });

  // Memory cache'e sadece claims kaydet - TTL: 1 saat (event-based invalidation kullanıyoruz)
  await cache.set(CLAIMS_CACHE_KEY(userId), data.claims, 3600);
}

/**
 * Kullanıcının belirli bir permission'a sahip olup olmadığını kontrol eder
 * @param claims Kullanıcının claim'leri (UUID-keyed organizations)
 * @param permission Kontrol edilecek permission
 * @param organizationUuid Opsiyonel: Organization UUID (güvenlik için)
 * @param organizationType Organization türü
 */
export function hasPermission(
  claims: UserClaims,
  permission: PermissionKey,
  organizationUuid?: string,
  organizationType?: OrganizationType,
): boolean {
  // Global permission kontrolü (wildcard matching ile)
  for (const claimPerm of claims.global) {
    if (matchesWildcard(permission, claimPerm)) {
      // ⚠️ Global wildcard (*) için scope check YAPMA - tüm permission'lara izin ver
      if (claimPerm === '*') {
        return true;
      }

      // ⚠️ SCOPE CHECK: Permission'ın global scope'ta kullanılabilir olduğunu kontrol et
      // Bu sayede global role'de "user-members:*" olsa bile
      // "user-members:add-own-organization" gibi sadece company scope'lu permission'lar reddedilir
      if (isPermissionAllowedForOrganizationType(permission, null)) {
        return true;
      }
    }
  }

  // Organization bazlı permission kontrolü (UUID kullanılıyor)
  if (organizationUuid && organizationType) {
    const orgClaims = claims.organizations[organizationType]?.[organizationUuid];

    if (orgClaims) {
      for (const claimPerm of orgClaims) {
        if (matchesWildcard(permission, claimPerm)) {
          // ⚠️ Global wildcard (*) için scope check YAPMA - tüm permission'lara izin ver
          if (claimPerm === '*') {
            return true;
          }

          // ⚠️ SCOPE CHECK: Permission'ın bu organization type'da kullanılabilir olduğunu kontrol et
          if (isPermissionAllowedForOrganizationType(permission, organizationType)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Kullanıcının claim'lerini yeniden hesaplar ve kaydeder
 * Permission değişikliği sonrası çağrılmalıdır
 */
export async function refreshUserClaims(userId: string): Promise<void> {
  // Claim'leri yeniden hesapla
  const result = await calculateUserClaims(userId);

  // DB'ye ve cache'e kaydet
  await saveUserClaims(userId, result);
}

/**
 * Kullanıcının claims cache'ini invalidate eder (hem DB hem memory)
 * Lazy loading: Next access'te claims otomatik hesaplanacak
 *
 * 🔒 SECURITY: DB-first invalidation strategy - önce DB, sonra cache
 * Bu sayede cache silme fail olsa bile DB'den stale data okunmaz
 *
 * ⚠️ Bu fonksiyon SADECE claims'i invalidate eder, roles'u DEĞİL!
 * Eğer kullanıcının rolleri de değiştiyse `invalidateUserClaimsAndRoles` kullanın.
 */
export async function invalidateUserClaims(
  userId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const client = tx || prisma;

    // 1️⃣ Önce DB'yi invalidate et (fail-safe: DB always truth source)
    await client.user.update({
      where: { id: userId },
      data: {
        claims: Prisma.JsonNull,
      },
    });

    // 2️⃣ Sonra memory cache'i temizle (fail etse bile DB null olduğu için güvenli)
    await cache.del(CLAIMS_CACHE_KEY(userId));
  } catch (error) {
    // Log error but continue - en azından DB'yi invalidate ettik
    console.error(`Failed to fully invalidate claims for user ${userId}:`, error);

    // Fallback: En azından memory cache'i temizlemeye çalış
    await cache.del(CLAIMS_CACHE_KEY(userId)).catch(() => {
      // Intentionally empty - best effort cleanup
    });
  }
}

/**
 * Kullanıcının hem claims hem roles cache'ini invalidate eder
 * Role assignment değişikliği sonrası kullanılır (atama/kaldırma)
 * Lazy loading: Next access'te hem claims hem roles otomatik hesaplanacak
 *
 * 🔒 SECURITY: DB-first invalidation strategy
 */
export async function invalidateUserClaimsAndRoles(
  userId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const client = tx || prisma;

    // 1️⃣ Önce DB'yi invalidate et
    await client.user.update({
      where: { id: userId },
      data: {
        claims: Prisma.JsonNull,
        roles: Prisma.JsonNull,
      },
    });

    // 2️⃣ Sonra memory cache'i temizle
    await cache.del(CLAIMS_CACHE_KEY(userId));
  } catch (error) {
    console.error(`Failed to fully invalidate claims and roles for user ${userId}:`, error);
    // Try to clean cache anyway
    await cache.del(CLAIMS_CACHE_KEY(userId)).catch(() => {
      // Intentionally empty - best effort cleanup
    });
  }
}

/**
 * Birden fazla kullanıcının claim'lerini yeniler
 * @param userIds Yenilenecek kullanıcı ID'leri (boş ise tüm kullanıcılar)
 */
export async function refreshMultipleUserClaims(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  // Batch size: 50 kullanıcıdan fazla ise batch'ler halinde işle
  const BATCH_SIZE = 50;

  if (userIds.length <= BATCH_SIZE) {
    // Küçük batch: Paralel işle
    await Promise.all(userIds.map((userId) => refreshUserClaims(userId)));
  } else {
    // Büyük batch: Sıralı batch'ler halinde işle
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((userId) => refreshUserClaims(userId)));
    }
  }
}

/**
 * Belirli bir role sahip tüm kullanıcıların claims'lerini invalidate eder
 * Role değişikliği (name, permissions) sonrası kullanılır
 *
 * ⚠️ IMPORTANT: Sadece claims invalidate edilir, roles DEĞİL!
 * Çünkü role'ün permissions'ı değişti ama roller DEĞİŞMEDİ.
 * Lazy loading: Her kullanıcı için claims ihtiyaç anında hesaplanacak
 *
 * 🔒 SECURITY: DB-first invalidation strategy
 */
export async function invalidateClaimsForRole(roleId: number): Promise<void> {
  // Bu role sahip tüm kullanıcıları bul
  const userRoles = await prisma.userRole.findMany({
    where: { roleId },
    select: { userId: true },
  });

  const userIds = userRoles.map((ur) => ur.userId);

  if (userIds.length === 0) {
    return; // Bu role atanmış kullanıcı yok
  }

  try {
    // 1️⃣ Önce DB'yi invalidate et
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        claims: Prisma.JsonNull,
        // roles: Prisma.JsonNull, ❌ YAPMA! Roller değişmedi, tekrar hesaplama gereği yok
      },
    });

    // 2️⃣ Sonra memory cache'leri temizle
    await Promise.all(userIds.map((userId) => cache.del(CLAIMS_CACHE_KEY(userId))));
  } catch (error) {
    console.error(`Failed to fully invalidate claims for role ${roleId}:`, error);
    // Try to clean cache anyway
    await Promise.all(
      userIds.map((userId) =>
        cache.del(CLAIMS_CACHE_KEY(userId)).catch(() => {
          // Intentionally empty - best effort cleanup
        }),
      ),
    );
  }
}

/**
 * Tüm kullanıcıların claims cache'lerini temizler
 * Toplu permission değişikliği sonrası kullanılır (e.g., global permission structure change)
 *
 * ⚠️ IMPORTANT: roles cache'i korunur çünkü roller değişmedi, sadece permission sistemi değişti.
 * Lazy loading: Her kullanıcı için claims ihtiyaç anında hesaplanacak
 *
 * 🔒 SECURITY: DB-first invalidation strategy
 */
export async function invalidateAllClaims(): Promise<void> {
  try {
    // 1️⃣ Önce DB'yi invalidate et
    await prisma.user.updateMany({
      data: {
        claims: Prisma.JsonNull,
        // roles: Prisma.JsonNull, ❌ YAPMA! Roller değişmedi
      },
    });

    // 2️⃣ Sonra memory cache'leri temizle (wildcard pattern ile)
    await cache.del('user:*:claims');
  } catch (error) {
    console.error('Failed to fully invalidate all claims:', error);
  }
}

