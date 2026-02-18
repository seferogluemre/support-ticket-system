import { cache } from '#core';
import prisma from '@onlyjs/db';
import type { Prisma } from '@onlyjs/db/client';
import type { RoleType } from '@onlyjs/db/enums';
import type { PermissionKey } from '../permissions';
import type { OrganizationType } from '@onlyjs/db/enums';
import type { MemberData, OrganizationDetails } from './types';

/**
 * Default role definitions for organization initialization
 */
export interface DefaultRoleDefinition {
  type: Exclude<RoleType, 'CUSTOM'>;
  name: string;
  description: string;
  permissions: PermissionKey[];
  order: number;
}

/**
 * Organization membership behavior configuration
 */
export interface OrganizationMembershipConfig {
  /**
   * If true, user will be soft-deleted when removed from this organization type
   * ONLY IF they have no remaining memberships of the same organization type
   *
   * Use for exclusive organizations where user should not exist outside of it
   *
   * Example: User has 3 company memberships
   * - Remove membership 1: User has 2 left → User NOT deleted
   * - Remove membership 2: User has 1 left → User NOT deleted
   * - Remove membership 3: User has 0 left → User IS deleted ✅
   *
   * @default false
   */
  readonly deleteUserOnRemoval: boolean;

  /**
   * Maximum number of memberships a user can have for this organization type
   * - null: No limit (user can join unlimited organizations)
   * - 1: Exclusive (user can only be member of ONE organization of this type)
   * - n: User can be member of up to n organizations
   * @default null (unlimited)
   */
  readonly maxMembershipsPerUser: number | null;
}

/**
 * Base Organization Adapter - UUID ↔ ID Mapping Cache
 *
 * Her adapter bu class'ı extend ederek otomatik caching kazanır.
 * Cache keys organizationType'a göre ayrılır.
 */
export abstract class BaseOrganizationAdapter {
  abstract readonly organizationType: OrganizationType;

  /**
   * Organization membership behavior configuration
   * Override in child adapters to customize behavior
   */
  protected readonly membershipConfig: OrganizationMembershipConfig = {
    deleteUserOnRemoval: false,
    maxMembershipsPerUser: null,
  };

  // Cache TTL: 1 hour (ID'ler genelde değişmez)
  private readonly CACHE_TTL = 3600;

  /**
   * 🔒 Cache key generators
   */
  private uuidToIdCacheKey(uuid: string): string {
    return `org:${this.organizationType}:uuid2id:${uuid}`;
  }

  private idToUuidCacheKey(id: number): string {
    return `org:${this.organizationType}:id2uuid:${id}`;
  }

  /**
   * 🔍 Get count of user's memberships for this organization type
   *
   * Helper method to check how many organizations of this type the user belongs to
   * Used for membership limit checks and soft-delete decisions
   *
   * @param userId User ID
   * @param excludeOrganizationId Optional organization ID to exclude from count
   * @param tx Optional transaction client
   * @returns Count of memberships
   */
  async getUserMembershipCount(
    userId: string,
    excludeOrganizationId?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || prisma;

    // Get all distinct organization IDs user is member of for this org type
    const memberships = await client.userRole.findMany({
      where: {
        userId,
        organizationType: this.organizationType,
        ...(excludeOrganizationId && {
          NOT: { organizationId: excludeOrganizationId },
        }),
      },
      select: { organizationId: true },
      distinct: ['organizationId'],
    });

    return memberships.length;
  }

  /**
   * Organization initialization için default roller tanımla
   * Child adapter'lar bu metodu override ederek kendi default rollerini belirleyebilir
   * @returns Default BASIC ve ADMIN rolleri
   */
  protected getDefaultRoles(): DefaultRoleDefinition[] {
    // Override edilebilir - default implementation
    return [
      {
        type: 'BASIC',
        name: 'Member',
        description: 'Basic member with limited permissions',
        permissions: [],
        order: 1,
      },
      {
        type: 'ADMIN',
        name: 'Admin',
        description: 'Administrator with full permissions',
        permissions: [],
        order: 100,
      },
    ];
  }

  /**
   * Default rolleri veritabanında oluşturur
   * @param organizationId Organization ID
   * @param tx Opsiyonel transaction
   * @returns Oluşturulan roller
   * @protected
   */
  protected async createDefaultRoles(organizationId: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const defaultRoles = this.getDefaultRoles();

    const createdRoles = [];
    for (const roleDefinition of defaultRoles) {
      const role = await client.role.create({
        data: {
          type: roleDefinition.type,
          name: roleDefinition.name,
          description: roleDefinition.description,
          permissions: roleDefinition.permissions,
          order: roleDefinition.order,
          organizationType: this.organizationType,
          organizationId: organizationId,
        },
      });
      createdRoles.push(role);
    }

    return createdRoles;
  }

  /**
   * Organization oluşturulduğunda çağrılır - default rolleri ve owner'ı ayarlar
   * @param organizationUuid Organization UUID
   * @param ownerUuid Organization owner user UUID
   * @param tx Opsiyonel transaction
   */
  abstract initialize(
    organizationUuid: string,
    ownerUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Organization owner'ının UUID'sini getirir
   * @param organizationUuid Organization UUID
   * @param tx Opsiyonel transaction
   * @returns Owner user UUID veya null
   */
  abstract getOwnerUuid(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null>;

  /**
   * Organization name'ini getirir
   * @param organizationUuid Organization UUID
   * @param tx Opsiyonel transaction
   * @returns Organization name veya null
   */
  abstract getOrganizationName(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null>;

  /**
   * Organization logo source'unu getirir
   * @param organizationUuid Organization UUID
   * @param tx Opsiyonel transaction
   * @returns Logo file source veya null
   */
  abstract getOrganizationLogoSrc(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null>;

  /**
   * Organization'ın tüm detaylarını tek seferde getirir (performans için)
   * Child adapter'lar bunu override edip tek query'de tüm bilgileri alabilir
   *
   * @param organizationUuid Organization UUID
   * @param tx Opsiyonel transaction
   * @returns Organization details veya null
   */
  async getOrganizationDetails(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationDetails | null> {
    // Default implementation: Call individual methods
    const [name, logoSrc, ownerUuid] = await Promise.all([
      this.getOrganizationName(organizationUuid, tx),
      this.getOrganizationLogoSrc(organizationUuid, tx),
      this.getOwnerUuid(organizationUuid, tx),
    ]);

    if (!name || !ownerUuid) {
      return null;
    }

    return {
      uuid: organizationUuid,
      name,
      logoSrc,
      ownerUuid,
    };
  }

  /**
   * Kullanıcının organization owner'ı olup olmadığını kontrol eder
   * @param userId Kullanıcı UUID
   * @param organizationUuid Organization UUID
   * @param tx Opsiyonel transaction
   * @returns true ise kullanıcı owner'dır
   */
  abstract isOwner(
    userId: string,
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean>;

  /**
   * Kullanıcının organization'a üye olup olmadığını kontrol eder
   * @param userId Kullanıcı ID
   * @param organizationId Organization ID
   * @param tx Opsiyonel transaction
   * @returns true ise kullanıcı organization'a üyedir
   */
  abstract isMember(
    userId: string,
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean>;

  /**
   * 🔒 Validate membership constraints before adding a member
   * Checks maxMembershipsPerUser configuration
   *
   * @param userId User ID
   * @param organizationId Organization ID
   * @throws ConflictException if membership limit exceeded
   */
  async validateMembershipConstraints(userId: string, organizationId: number): Promise<void> {
    if (this.membershipConfig.maxMembershipsPerUser === null) {
      return; // No limit
    }

    const currentCount = await this.getUserMembershipCount(userId, organizationId);

    if (currentCount >= this.membershipConfig.maxMembershipsPerUser) {
      throw new Error(
        `Bu kullanıcı maksimum ${this.membershipConfig.maxMembershipsPerUser} adet ${this.organizationType} organizasyonuna üye olabilir`,
      );
    }
  }

  /**
   * 🗑️ Handle user soft-delete after membership removal (PRIVATE)
   * Checks deleteUserOnRemoval configuration
   *
   * @param userId User ID
   * @param organizationId Organization ID (to exclude from count)
   * @param tx Transaction client
   */
  private async handleUserDeletionAfterRemoval(
    userId: string,
    organizationId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!this.membershipConfig.deleteUserOnRemoval) {
      return; // No auto-deletion
    }

    const remainingCount = await this.getUserMembershipCount(userId, organizationId, tx);

    if (remainingCount === 0) {
      // This was the user's LAST membership of this type → soft-delete
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    }
  }

  /**
   * Kullanıcıyı organization'a üye olarak ekler
   * @param userId Kullanıcı ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   * @param extraData Adapter-specific extra data
   */
  abstract addMember(
    userId: string,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
    extraData?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * 🔄 Template Method: Remove member with automatic cleanup
   *
   * This is the public API. It:
   * 1. Creates a transaction if needed
   * 2. Calls doRemoveMember() (implemented by child adapter)
   * 3. Handles user soft-deletion if configured
   *
   * Child adapters should implement doRemoveMember() instead of this method
   *
   * @param userId Kullanıcı ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async removeMember(
    userId: string,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const executeRemoval = async (client: Prisma.TransactionClient) => {
      // Execute adapter-specific removal logic
      await this.doRemoveMember(userId, organizationId, currentUser, client);

      // Handle user soft-deletion if configured
      await this.handleUserDeletionAfterRemoval(userId, organizationId, client);
    };

    // If transaction provided, use it; otherwise create one
    tx ? await executeRemoval(tx) : await prisma.$transaction(executeRemoval);
  }

  /**
   * 🔧 Actual member removal logic (implemented by child adapters)
   *
   * This method performs the adapter-specific removal:
   * - Remove from member table (e.g., CompanyMember, CompanyMember)
   * - Clean up adapter-specific relations
   *
   * @param userId Kullanıcı ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Transaction client (guaranteed to be present)
   * @protected
   */
  protected abstract doRemoveMember(
    userId: string,
    organizationId: number,
    currentUser: { id: string },
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Get ALL members of an organization with their member-specific data
   * This method MUST be overridden by child adapters to fetch from their member table
   * (e.g., CompanyMember, CompanyMember, etc.)
   *
   * @param organizationId Organization ID
   * @param tx Opsiyonel transaction
   * @returns Map of userId to MemberData for ALL members
   */
  abstract getAllMembersData(
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, MemberData>>;

  /**
   * Get user's memberships for this organization type
   * Returns array in UserMembership format (organization-agnostic)
   * 
   * Each adapter should return memberships with:
   * - organizationType: this.organizationType
   * - organizationUuid: organization UUID
   * - isAdmin?: true (only if admin)
   * - isOwner?: true (only if owner)
   * - joinedAt: ISO string
   */
  abstract getUserMemberships(userId: string): Promise<Array<{
    organizationType: OrganizationType;
    organizationUuid: string;
    isAdmin?: true;
    isOwner?: true;
    joinedAt: string;
  }>>;

  /**
   * Invalidate membership cache for a user in this organization type
   */
  abstract invalidateUserMemberships(userId: string): Promise<void>;

  /**
   * Invalidate membership cache for all users in an organization
   */
  abstract invalidateMembershipsForOrganization(organizationId: number): Promise<void>;

  /**
   * Get member-specific data (isAdmin, joinedAt, updatedAt)
   * This method can be overridden by child adapters to provide custom logic
   * Default implementation calculates isAdmin from roles
   *
   * @param userId Kullanıcı ID
   * @param organizationId Organization ID
   * @param tx Opsiyonel transaction
   * @returns Member data with isAdmin flag and timestamps
   */
  async getMemberData(
    userId: string,
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<MemberData> {
    const client = tx || prisma;

    // Default implementation: Calculate isAdmin from roles
    const hasAdminRole = await client.userRole.count({
      where: {
        userId,
        organizationType: this.organizationType,
        organizationId,
        role: {
          type: 'ADMIN',
        },
      },
    });

    // Get first role's timestamp as joinedAt
    const firstRole = await client.userRole.findFirst({
      where: {
        userId,
        organizationType: this.organizationType,
        organizationId,
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      isAdmin: hasAdminRole > 0,
      createdAt: firstRole?.createdAt || new Date(),
      updatedAt: firstRole?.createdAt || new Date(),
    };
  }

  /**
   * Get member-specific data for multiple users (batch operation)
   * This method can be overridden by child adapters for better performance
   * Default implementation calls getMemberData for each user
   *
   * @param userIds Array of user IDs
   * @param organizationId Organization ID
   * @param tx Opsiyonel transaction
   * @returns Map of userId to MemberData
   */
  async getBatchMemberData(
    userIds: string[],
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, MemberData>> {
    const client = tx || prisma;
    const result = new Map<string, MemberData>();

    // Default implementation: Get all user roles in one query
    const userRoles = await client.userRole.findMany({
      where: {
        userId: { in: userIds },
        organizationType: this.organizationType,
        organizationId,
      },
      include: {
        role: {
          select: { type: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by userId and calculate isAdmin
    for (const userId of userIds) {
      const rolesForUser = userRoles.filter((ur) => ur.userId === userId);
      const hasAdminRole = rolesForUser.some((ur) => ur.role.type === 'ADMIN');
      const firstRole = rolesForUser[0];

      result.set(userId, {
        isAdmin: hasAdminRole,
        createdAt: firstRole?.createdAt || new Date(),
        updatedAt: firstRole?.createdAt || new Date(),
      });
    }

    return result;
  }

  /**
   * Hook: Role atama öncesi adapter-specific kontroller
   * @param userId Kullanıcı ID
   * @param roleId Rol ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async beforeAddRole?(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Hook: Role kaldırma öncesi adapter-specific kontroller
   * @param userId Kullanıcı ID
   * @param roleId Rol ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async beforeRemoveRole?(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Hook: Role atama sonrası adapter-specific işlemler
   * @param userId Kullanıcı ID
   * @param roleId Rol ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async afterAddRole?(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Hook: Role kaldırma sonrası adapter-specific işlemler
   * @param userId Kullanıcı ID
   * @param roleId Rol ID
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async afterRemoveRole?(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void>;

  /**
   * Hook: Multiple role atama öncesi adapter-specific kontroller
   * Default implementation: Loop through single hooks
   * @param userId Kullanıcı ID
   * @param roleIds Rol ID'leri
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async beforeAddRoles(
    userId: string,
    roleIds: number[],
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Only call if single hook exists
    if (this.beforeAddRole) {
      for (const roleId of roleIds) {
        await this.beforeAddRole(userId, roleId, organizationId, currentUser, tx);
      }
    }
  }

  /**
   * Hook: Multiple role kaldırma öncesi adapter-specific kontroller
   * Default implementation: Loop through single hooks
   * @param userId Kullanıcı ID
   * @param roleIds Rol ID'leri
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async beforeRemoveRoles(
    userId: string,
    roleIds: number[],
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Only call if single hook exists
    if (this.beforeRemoveRole) {
      for (const roleId of roleIds) {
        await this.beforeRemoveRole(userId, roleId, organizationId, currentUser, tx);
      }
    }
  }

  /**
   * Hook: Multiple role atama sonrası adapter-specific işlemler
   * Default implementation: Loop through single hooks
   * @param userId Kullanıcı ID
   * @param roleIds Rol ID'leri
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async afterAddRoles(
    userId: string,
    roleIds: number[],
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Only call if single hook exists
    if (this.afterAddRole) {
      for (const roleId of roleIds) {
        await this.afterAddRole(userId, roleId, organizationId, currentUser, tx);
      }
    }
  }

  /**
   * Hook: Multiple role kaldırma sonrası adapter-specific işlemler
   * Default implementation: Loop through single hooks
   * @param userId Kullanıcı ID
   * @param roleIds Rol ID'leri
   * @param organizationId Organization ID
   * @param currentUser İşlemi yapan kullanıcı
   * @param tx Opsiyonel transaction
   */
  async afterRemoveRoles(
    userId: string,
    roleIds: number[],
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // Only call if single hook exists
    if (this.afterRemoveRole) {
      for (const roleId of roleIds) {
        await this.afterRemoveRole(userId, roleId, organizationId, currentUser, tx);
      }
    }
  }

  // ========================================================================
  // 🌐 Public API - Cache-enabled UUID ↔ ID conversions
  // ========================================================================

  /**
   * 🔒 Get organization ID by UUID (cached)
   * Önce cache'e bakar, yoksa fetchOrganizationId()'yi çağırır
   */
  async getOrganizationId(uuid: string): Promise<number | null> {
    // Cache check
    const cachedId = await cache.get<string>(this.uuidToIdCacheKey(uuid));
    if (cachedId !== null) {
      return Number(cachedId);
    }

    // Cache miss - fetch from DB
    const id = await this.fetchOrganizationId(uuid);

    if (id !== null) {
      // Cache both directions (UUID→ID and ID→UUID)
      await Promise.all([
        cache.set(this.uuidToIdCacheKey(uuid), id.toString(), this.CACHE_TTL),
        cache.set(this.idToUuidCacheKey(id), uuid, this.CACHE_TTL),
      ]);
    }

    return id;
  }

  /**
   * 🔒 Get organization UUID by ID (cached)
   * Önce cache'e bakar, yoksa fetchOrganizationUuid()'yi çağırır
   */
  async getOrganizationUuid(id: number): Promise<string | null> {
    // Cache check
    const cachedUuid = await cache.get<string>(this.idToUuidCacheKey(id));
    if (cachedUuid !== null) {
      return cachedUuid;
    }

    // Cache miss - fetch from DB
    const uuid = await this.fetchOrganizationUuid(id);

    if (uuid !== null) {
      // Cache both directions (UUID→ID and ID→UUID)
      await Promise.all([
        cache.set(this.idToUuidCacheKey(id), uuid, this.CACHE_TTL),
        cache.set(this.uuidToIdCacheKey(uuid), id.toString(), this.CACHE_TTL),
      ]);
    }

    return uuid;
  }

  /**
   * 🔒 Get multiple organization IDs by UUIDs (batch cached)
   * Cache'den gelenleri döndürür, olmayanları fetchOrganizationIds()'den alır
   */
  async getOrganizationIds(uuids: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    const uncachedUuids: string[] = [];

    // Step 1: Cache lookup
    await Promise.all(
      uuids.map(async (uuid) => {
        const cachedId = await cache.get<string>(this.uuidToIdCacheKey(uuid));
        if (cachedId !== null) {
          result[uuid] = Number(cachedId);
        } else {
          uncachedUuids.push(uuid);
        }
      }),
    );

    // Step 2: Fetch uncached from DB
    if (uncachedUuids.length > 0) {
      const fetchedIds = await this.fetchOrganizationIds(uncachedUuids);

      // Step 3: Cache fetched results
      await Promise.all(
        Object.entries(fetchedIds).map(async ([uuid, id]) => {
          result[uuid] = id;
          // Cache both directions
          await Promise.all([
            cache.set(this.uuidToIdCacheKey(uuid), id.toString(), this.CACHE_TTL),
            cache.set(this.idToUuidCacheKey(id), uuid, this.CACHE_TTL),
          ]);
        }),
      );
    }

    return result;
  }

  /**
   * 🔒 Get multiple organization UUIDs by IDs (batch cached)
   * Cache'den gelenleri döndürür, olmayanları fetchOrganizationUuids()'den alır
   */
  async getOrganizationUuids(ids: number[]): Promise<Record<number, string>> {
    const result: Record<number, string> = {};
    const uncachedIds: number[] = [];

    // Step 1: Cache lookup
    await Promise.all(
      ids.map(async (id) => {
        const cachedUuid = await cache.get<string>(this.idToUuidCacheKey(id));
        if (cachedUuid !== null) {
          result[id] = cachedUuid;
        } else {
          uncachedIds.push(id);
        }
      }),
    );

    // Step 2: Fetch uncached from DB
    if (uncachedIds.length > 0) {
      const fetchedUuids = await this.fetchOrganizationUuids(uncachedIds);

      // Step 3: Cache fetched results
      await Promise.all(
        Object.entries(fetchedUuids).map(async ([idStr, uuid]) => {
          const id = Number(idStr);
          result[id] = uuid;
          // Cache both directions
          await Promise.all([
            cache.set(this.idToUuidCacheKey(id), uuid, this.CACHE_TTL),
            cache.set(this.uuidToIdCacheKey(uuid), id.toString(), this.CACHE_TTL),
          ]);
        }),
      );
    }

    return result;
  }

  /**
   * 🗑️ Cache invalidation - Organization değiştiğinde cache'i temizle
   */
  protected async invalidateOrganizationCache(uuid: string, id: number): Promise<void> {
    await Promise.all([
      cache.del(this.uuidToIdCacheKey(uuid)),
      cache.del(this.idToUuidCacheKey(id)),
    ]);
  }

  // ========================================================================
  // 🗄️ Abstract DB Fetch Methods - Child adapters implement these
  // ========================================================================

  /**
   * DB'den UUID → ID dönüşümü (cache miss durumunda çağrılır)
   */
  protected abstract fetchOrganizationId(uuid: string): Promise<number | null>;

  /**
   * DB'den ID → UUID dönüşümü (cache miss durumunda çağrılır)
   */
  protected abstract fetchOrganizationUuid(id: number): Promise<string | null>;

  /**
   * DB'den batch UUID → ID dönüşümü (cache miss durumunda çağrılır)
   * Optional - implement edilmezse fallback olarak tek tek fetchOrganizationId çağrılır
   */
  protected async fetchOrganizationIds(uuids: string[]): Promise<Record<string, number>> {
    // Default fallback: tek tek fetch (child class override edebilir)
    const result: Record<string, number> = {};
    await Promise.all(
      uuids.map(async (uuid) => {
        const id = await this.fetchOrganizationId(uuid);
        if (id !== null) {
          result[uuid] = id;
        }
      }),
    );
    return result;
  }

  /**
   * DB'den batch ID → UUID dönüşümü (cache miss durumunda çağrılır)
   * Optional - implement edilmezse fallback olarak tek tek fetchOrganizationUuid çağrılır
   */
  protected async fetchOrganizationUuids(ids: number[]): Promise<Record<number, string>> {
    // Default fallback: tek tek fetch (child class override edebilir)
    const result: Record<number, string> = {};
    await Promise.all(
      ids.map(async (id) => {
        const uuid = await this.fetchOrganizationUuid(id);
        if (uuid !== null) {
          result[id] = uuid;
        }
      }),
    );
    return result;
  }
}
