import { cache } from '#core';
import prisma from '@onlyjs/db';
import { Prisma } from '@onlyjs/db/client';
import { OrganizationType } from '@onlyjs/db/enums';
import { organizationRegistry } from '../organizations';
import type { UserMembership } from './types';

const MEMBERSHIPS_CACHE_KEY = (userId: string) => `user:${userId}:memberships`;

export abstract class UserMembershipsService {
  /**
   * Get user memberships from cache (3-tier: Memory → DB → Calculate)
   */
  static async getUserMemberships(userId: string): Promise<UserMembership[]> {
    // 1. Memory cache check
    const cachedMemberships = await cache.get<UserMembership[]>(MEMBERSHIPS_CACHE_KEY(userId));
    if (cachedMemberships) {
      return cachedMemberships;
    }

    // 2. DB cached memberships check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { memberships: true },
    });

    if (user?.memberships && Array.isArray(user.memberships)) {
      const dbMemberships = user.memberships as unknown as UserMembership[];
      // Save to memory cache - TTL: 1 hour
      await cache.set(MEMBERSHIPS_CACHE_KEY(userId), dbMemberships, 3600);
      return dbMemberships;
    }

    // 3. Calculate memberships from all organization adapters
    const memberships = await this.calculateUserMemberships(userId);

    // 4. Save to DB and cache
    await this.saveUserMemberships(userId, memberships);

    return memberships;
  }

  /**
   * Calculate user memberships from all organization adapters
   * Organization-agnostic: uses adapter pattern
   *
   * Adapters return memberships in UserMembership format directly
   */
  private static async calculateUserMemberships(userId: string): Promise<UserMembership[]> {
    const allMemberships: UserMembership[] = [];

    // Get memberships from all organization types
    for (const orgType of Object.values(OrganizationType)) {
      const adapter = organizationRegistry.get(orgType);
      if (!adapter) continue;

      try {
        // Adapter returns memberships in UserMembership format
        const orgMemberships = await adapter.getUserMemberships(userId);
        allMemberships.push(...orgMemberships);
      } catch (error) {
        console.error(`Failed to get memberships for ${orgType}:`, error);
        // Continue with other organization types
      }
    }

    return allMemberships;
  }

  /**
   * Save user memberships to DB and memory cache
   */
  private static async saveUserMemberships(
    userId: string,
    memberships: UserMembership[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;

    // Save to DB
    await client.user.update({
      where: { id: userId },
      data: {
        memberships: memberships as unknown as Prisma.InputJsonValue,
      },
    });

    // Save to memory cache - TTL: 1 hour
    await cache.set(MEMBERSHIPS_CACHE_KEY(userId), memberships, 3600);
  }

  /**
   * Invalidate user memberships cache
   * DB-first invalidation strategy for security
   * Sets to null to force recalculation on next access
   */
  static async invalidateUserMemberships(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;

    try {
      // 1️⃣ First invalidate DB cache (set to null to force recalculation)
      await client.user.update({
        where: { id: userId },
        data: {
          memberships: Prisma.JsonNull,
        },
      });

      // 2️⃣ Then clear memory cache
      await cache.del(MEMBERSHIPS_CACHE_KEY(userId));
    } catch (error) {
      console.error(`Failed to fully invalidate memberships for user ${userId}:`, error);

      // Fallback: Try to clean memory cache anyway
      await cache.del(MEMBERSHIPS_CACHE_KEY(userId)).catch(() => {
        // Intentionally empty - best effort cleanup
      });
    }
  }

  /**
   * Invalidate memberships for all users of an organization
   * Organization-agnostic: uses adapter pattern
   * 
   * Use cases:
   * - Organization deleted
   * - Organization ownership transferred
   * - Bulk member changes
   * 
   * Note: Individual member changes (add/remove/update) should use
   * invalidateUserMemberships() instead for better performance
   *
   * @param organizationType Organization type (e.g., OrganizationType.COMPANY)
   * @param organizationId Organization ID
   */
  static async invalidateMembershipsForOrganization(
    organizationType: OrganizationType,
    organizationId: number,
  ): Promise<void> {
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      console.error(`Organization adapter not found for type: ${organizationType}`);
      return;
    }

    // Use adapter to invalidate memberships
    await adapter.invalidateMembershipsForOrganization(organizationId);
  }
}
