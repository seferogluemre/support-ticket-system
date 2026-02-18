import { RedisClient } from 'bun';
import type { Primitive } from 'type-fest';

class NotConnectedError extends Error {
  constructor() {
    super('Redis client is not connected');
  }
}

class Cache {
  private client?: RedisClient;
  private prefix = '';

  constructor() {
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL is not set, cache will not be used');
      return;
    }

    this.prefix = process.env.APP_SLUG ? `${process.env.APP_SLUG}:` : '';

    try {
      this.client = new RedisClient(process.env.REDIS_URL);

      this.client.onconnect = () => {
        console.info('Redis client connected');
      };

      this.client.onclose = (error) => {
        if (error) {
          console.error('Redis client disconnected with error:', error.message);
        } else {
          console.info('Redis client disconnected');
        }
      };
    } catch (err) {
      console.error('Redis Client Error', err);
    }
  }

  private checkConnection() {
    if (!this.client) {
      throw new NotConnectedError();
    }
  }

  private getKeyWithPrefix(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getPrimitive<T extends string>(key: T): Promise<Primitive> {
    const value = await this.get<Primitive>(key);
    return value;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      this.checkConnection();
      const value = await this.client!.get(this.getKeyWithPrefix(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache get error:', error);
      }
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number) {
    try {
      this.checkConnection();
      const stringValue = JSON.stringify(value);
      const prefixedKey = this.getKeyWithPrefix(key);
      if (ttl) {
        await this.client!.setex(prefixedKey, ttl, stringValue);
      } else {
        await this.client!.set(prefixedKey, stringValue);
      }
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache set error:', error);
      }
    }
  }

  private hasWildcardPattern(str: string): boolean {
    return /[*?[\]]/.test(str);
  }

  /**
   * SCAN iterator helper - production-safe alternative to KEYS
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const allKeys: string[] = [];
    let cursor = '0';

    do {
      const result = (await this.client!.send('SCAN', [
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '100',
      ])) as [string, string[]];
      cursor = result[0];
      allKeys.push(...result[1]);
    } while (cursor !== '0');

    return allKeys;
  }

  async del(keys: string | string[]): Promise<number> {
    try {
      this.checkConnection();

      const keyList = Array.isArray(keys) ? keys : [keys];
      let totalDeleted = 0;

      const directKeys = keyList.filter((key) => !this.hasWildcardPattern(key));
      const patterns = keyList.filter((key) => this.hasWildcardPattern(key));

      // Delete direct keys in batch
      if (directKeys.length > 0) {
        const prefixedKeys = directKeys.map((key) => this.getKeyWithPrefix(key));
        totalDeleted += await this.client!.del(...prefixedKeys);
      }

      // Delete pattern-matched keys using SCAN (production-safe)
      for (const pattern of patterns) {
        const prefixedPattern = this.getKeyWithPrefix(pattern);
        const matchedKeys = await this.scanKeys(prefixedPattern);

        if (matchedKeys.length > 0) {
          totalDeleted += await this.client!.del(...matchedKeys);
        }
      }

      return totalDeleted;
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache del error:', error);
      }
      return 0;
    }
  }

  /**
   * Get keys matching pattern using SCAN (production-safe)
   * Returns keys without the internal prefix to maintain API consistency
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      this.checkConnection();
      const prefixedPattern = this.getKeyWithPrefix(pattern);
      const allKeys = await this.scanKeys(prefixedPattern);

      // Remove prefix from returned keys to maintain API consistency
      // Cache users should not be aware of internal prefix implementation
      if (this.prefix) {
        return allKeys.map((key) =>
          key.startsWith(this.prefix) ? key.slice(this.prefix.length) : key
        );
      }

      return allKeys;
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache keys error:', error);
      }
      return [];
    }
  }

  async flushAll() {
    try {
      this.checkConnection();

      if (this.prefix) {
        const pattern = `${this.prefix}*`;
        let totalDeleted = 0;

        // Use SCAN instead of KEYS for production safety
        const keys = await this.scanKeys(pattern);
        if (keys.length > 0) {
          totalDeleted = await this.client!.del(...keys);
        }

        if (totalDeleted > 0) {
          console.info(
            `Redis cache flushed successfully: ${totalDeleted} keys with prefix '${this.prefix}' deleted`
          );
        } else {
          console.info(`No Redis keys found with prefix '${this.prefix}'`);
        }
      } else {
        await this.client!.send('FLUSHALL', []);
        console.info('Redis cache flushed successfully (entire database)');
      }
    } catch (error) {
      if (error instanceof NotConnectedError) {
        console.warn('Redis is not connected, cache flush skipped');
        return;
      } else {
        console.error('Cache flush error:', error);
        throw error;
      }
    }
  }

  // ====================================================================
  // Redis Set Operations (for connection tracking, etc.)
  // ====================================================================

  /**
   * Add member(s) to a set
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      this.checkConnection();
      // Filter out any undefined/null/empty values
      const validMembers = members.filter(
        (m): m is string => typeof m === 'string' && m.length > 0
      );
      if (validMembers.length === 0) {
        return 0;
      }
      const prefixedKey = this.getKeyWithPrefix(key);

      if (validMembers.length === 1) {
        // Use native method for single member (most common case)
        return await this.client!.sadd(prefixedKey, validMembers[0]!);
      }

      // For multiple members, loop through native calls
      // (Bun's native sadd only accepts single member per call)
      let added = 0;
      for (const member of validMembers) {
        added += await this.client!.sadd(prefixedKey, member);
      }
      return added;
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache sAdd error:', error);
      }
      return 0;
    }
  }

  /**
   * Remove member(s) from a set
   */
  async sRem(key: string, ...members: string[]): Promise<number> {
    try {
      this.checkConnection();
      // Filter out any undefined/null/empty values
      const validMembers = members.filter(
        (m): m is string => typeof m === 'string' && m.length > 0
      );
      if (validMembers.length === 0) {
        return 0;
      }
      const prefixedKey = this.getKeyWithPrefix(key);

      if (validMembers.length === 1) {
        // Use native method for single member (most common case)
        return await this.client!.srem(prefixedKey, validMembers[0]!);
      }

      // For multiple members, loop through native calls
      // (Bun's native srem only accepts single member per call)
      let removed = 0;
      for (const member of validMembers) {
        removed += await this.client!.srem(prefixedKey, member);
      }
      return removed;
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache sRem error:', error);
      }
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async sMembers(key: string): Promise<string[]> {
    try {
      this.checkConnection();
      const prefixedKey = this.getKeyWithPrefix(key);
      return await this.client!.smembers(prefixedKey);
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache sMembers error:', error);
      }
      return [];
    }
  }

  /**
   * Get the number of members in a set
   */
  async sCard(key: string): Promise<number> {
    try {
      this.checkConnection();
      const prefixedKey = this.getKeyWithPrefix(key);
      return await this.client!.scard(prefixedKey);
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache sCard error:', error);
      }
      return 0;
    }
  }

  /**
   * Check if a member exists in a set
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      this.checkConnection();
      const prefixedKey = this.getKeyWithPrefix(key);
      const result = await this.client!.sismember(prefixedKey, member);
      return Boolean(result);
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache sIsMember error:', error);
      }
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      this.checkConnection();
      const prefixedKey = this.getKeyWithPrefix(key);
      const result = await this.client!.expire(prefixedKey, seconds);
      return Boolean(result);
    } catch (error) {
      if (!(error instanceof NotConnectedError)) {
        console.error('Cache expire error:', error);
      }
      return false;
    }
  }
}

export const cache = new Cache();