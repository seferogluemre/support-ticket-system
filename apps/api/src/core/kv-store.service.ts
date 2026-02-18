import prisma from '@onlyjs/db';
import type { InputJsonValue } from '@onlyjs/db/client/runtime/library';
import { cache } from './cache';

export interface KVStoreOptions {
  ttl?: number;
  namespace?: string;
  description?: string;
  tags?: string[];
  useDb?: boolean; // Store in database (default: true)
  useCache?: boolean; // Store in Redis cache (default: true)
}

export interface KVStoreEntry {
  id: number;
  uuid: string;
  key: string;
  value: InputJsonValue;
  namespace: string;
  description?: string;
  tags: string[];
  expiresAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class KVStoreService {
  private static readonly DEFAULT_TTL = 60 * 60 * 24; // 24 hours
  private static readonly CACHE_PREFIX = 'kvstore';

  /**
   * Set a key-value pair
   */
  static async set<T>(key: string, value: T, options: KVStoreOptions = {}): Promise<void> {
    const {
      ttl = this.DEFAULT_TTL,
      namespace = 'default',
      description,
      tags = [],
      useDb = true,
      useCache = true,
    } = options;

    const now = new Date();
    const expiresAt = ttl > 0 ? new Date(now.getTime() + ttl * 1000) : null;

    // Store in database if requested
    if (useDb) {
      try {
        // Proper upsert using Prisma's built-in upsert
        await prisma.kvStore.upsert({
          where: {
            key_namespace: { key, namespace },
          },
          update: {
            value: value as InputJsonValue,
            description,
            tags,
            expiresAt,
            deletedAt: null,
            updatedAt: new Date(),
          },
          create: {
            key,
            value: value as InputJsonValue,
            namespace,
            description,
            tags,
            expiresAt,
            deletedAt: null,
          },
        });
      } catch (error) {
        console.error(`KVStore.set failed for key ${key}:`, error);
        throw error;
      }
    }

    // Store in cache if requested
    if (useCache) {
      const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
      await cache.set(cacheKey, JSON.stringify(value), ttl);
    }
  }

  /**
   * Get a value by key
   */
  static async get<T>(
    key: string,
    namespace: string = 'default',
    options: { useCache?: boolean; useDb?: boolean } = {},
  ): Promise<T | null> {
    const { useCache = true, useDb = true } = options;

    // Try cache first if enabled
    if (useCache) {
      const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached as string) as T;
        } catch (error) {
          console.warn(`Failed to parse cached value for key ${key}:`, error);
        }
      }
    }

    // Fallback to database if enabled
    if (useDb) {
      const record = await prisma.kvStore.findFirst({
        where: {
          key,
          namespace,
          deletedAt: null, // Soft delete filter
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (record) {
        const value = record.value as T;

        // Update cache if cache is enabled
        if (useCache) {
          const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
          const ttl = record.expiresAt
            ? Math.max(0, Math.floor((record.expiresAt.getTime() - Date.now()) / 1000))
            : this.DEFAULT_TTL;
          await cache.set(cacheKey, JSON.stringify(value), ttl);
        }

        return value;
      }
    }

    return null;
  }

  /**
   * Delete a key
   */
  static async delete(
    key: string,
    namespace: string = 'default',
    options: { useCache?: boolean; useDb?: boolean } = {},
  ): Promise<boolean> {
    const { useCache = true, useDb = true } = options;
    let deleted = false;

    // Remove from cache if requested
    if (useCache) {
      const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
      await cache.del(cacheKey);
      deleted = true; // Cache delete always succeeds
    }

    // Soft delete from database if requested
    if (useDb) {
      const result = await prisma.kvStore.updateMany({
        where: {
          key,
          namespace,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      deleted = deleted || result.count > 0;
    }

    return deleted;
  }

  /**
   * Get all keys in a namespace
   */
  static async keys(
    namespace: string = 'default', 
    options: { useCache?: boolean; useDb?: boolean } = {}
  ): Promise<string[]> {
    const { useCache = true, useDb = true } = options;

    // Try cache first if enabled
    if (useCache) {
      try {
        const cachePattern = `${this.CACHE_PREFIX}:${namespace}:*`;
        const cachedKeys = await cache.keys(cachePattern);
        
        if (cachedKeys.length > 0) {
          // Extract the actual key names from the cached keys
          // Format: "kvstore:namespace:actualKey" -> "actualKey"
          const prefix = `${this.CACHE_PREFIX}:${namespace}:`;
          return cachedKeys
            .filter(cacheKey => cacheKey.startsWith(prefix))
            .map(cacheKey => cacheKey.slice(prefix.length));
        }
      } catch (error) {
        console.warn(`Failed to get keys from cache for namespace ${namespace}:`, error);
      }
    }

    // Fallback to database if enabled and no cached keys found
    if (useDb) {
      const records = await prisma.kvStore.findMany({
        where: {
          namespace,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { key: true },
      });

      return records.map((record) => record.key);
    }

    return [];
  }

  /**
   * Clear all keys in a namespace
   */
  static async clearNamespace(
    namespace: string = 'default',
    options: { useCache?: boolean; useDb?: boolean } = {},
  ): Promise<number> {
    const { useCache = true, useDb = true } = options;
    let count = 0;

    // Clear cache keys if requested
    if (useCache) {
      try {
        // Get keys from both cache and DB to ensure complete cleanup
        const keys = await this.keys(namespace, { useCache: true, useDb: useDb });
        for (const key of keys) {
          const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
          await cache.del(cacheKey);
        }
        count = keys.length;
      } catch (error) {
        console.warn('Failed to clear cache keys:', error);
      }
    }

    // Soft delete from database if requested
    if (useDb) {
      const result = await prisma.kvStore.updateMany({
        where: {
          namespace,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      count = Math.max(count, result.count);
    }

    return count;
  }

  /**
   * Delete keys by pattern
   * 
   * @param pattern The pattern to match against
   * @param namespace The namespace to search in
   * @param options Configuration options
   * @returns Number of keys deleted
   * 
   * @example
   * // Delete all keys starting with "user-session-"
   * await KVStoreService.deleteByPattern('user-session-', 'auth', { patternType: 'prefix' });
   * 
   * // Delete all keys ending with "-cache"
   * await KVStoreService.deleteByPattern('-cache', 'default', { patternType: 'suffix' });
   * 
   * // Delete all keys containing "temp"
   * await KVStoreService.deleteByPattern('temp', 'default', { patternType: 'contains' });
   * 
   * // Delete all keys matching regex pattern
   * await KVStoreService.deleteByPattern('^user-\\d+-profile$', 'users', { patternType: 'regex' });
   */
  static async deleteByPattern(
    pattern: string,
    namespace: string = 'default',
    options: { 
      useCache?: boolean; 
      useDb?: boolean;
      patternType?: 'prefix' | 'suffix' | 'contains' | 'regex';
    } = {},
  ): Promise<number> {
    const { useCache = true, useDb = true, patternType = 'prefix' } = options;
    let totalDeleted = 0;

    try {
      // Get all keys in namespace (from both cache and DB to ensure complete pattern matching)
      const allKeys = await this.keys(namespace, { useCache: useCache, useDb: useDb });
      
      // Filter keys based on pattern type
      let matchedKeys: string[] = [];
      
      switch (patternType) {
        case 'prefix':
          matchedKeys = allKeys.filter(key => key.startsWith(pattern));
          break;
        case 'suffix':
          matchedKeys = allKeys.filter(key => key.endsWith(pattern));
          break;
        case 'contains':
          matchedKeys = allKeys.filter(key => key.includes(pattern));
          break;
        case 'regex': {
          const regex = new RegExp(pattern);
          matchedKeys = allKeys.filter(key => regex.test(key));
          break;
        }
        default:
          throw new Error(`Unsupported pattern type: ${patternType}`);
      }

      if (matchedKeys.length === 0) {
        return 0;
      }

      // Delete from cache if requested
      if (useCache) {
        const cacheKeys = matchedKeys.map(key => `${this.CACHE_PREFIX}:${namespace}:${key}`);
        const cacheDeleted = await cache.del(cacheKeys);
        totalDeleted = cacheDeleted;
      }

      // Soft delete from database if requested (bulk operation)
      if (useDb) {
        const result = await prisma.kvStore.updateMany({
          where: {
            key: { in: matchedKeys },
            namespace,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        });
        totalDeleted = Math.max(totalDeleted, result.count);
      }

      return totalDeleted;
    } catch (error) {
      console.error(`Failed to delete keys by pattern "${pattern}":`, error);
      throw error;
    }
  }

  /**
   * Get entry metadata
   */
  static async getEntry(key: string, namespace: string = 'default'): Promise<KVStoreEntry | null> {
    const record = await prisma.kvStore.findFirst({
      where: {
        key,
        namespace,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return record as KVStoreEntry | null;
  }

  /**
   * List all entries in a namespace with metadata
   */
  static async listEntries(namespace: string = 'default'): Promise<KVStoreEntry[]> {
    const records = await prisma.kvStore.findMany({
      where: {
        namespace,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return records as KVStoreEntry[];
  }

  /**
   * Check if key exists
   */
  static async exists(key: string, namespace: string = 'default'): Promise<boolean> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}:${namespace}:${key}`;
    const cached = await cache.get(cacheKey);
    if (cached) return true;

    // Check database
    const count = await prisma.kvStore.count({
      where: {
        key,
        namespace,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return count > 0;
  }
}
