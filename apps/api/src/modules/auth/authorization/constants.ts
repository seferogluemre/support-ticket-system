/**
 * Authorization System Constants
 */

/**
 * KV Store Keys for Authorization
 */
export const AUTH_KV_KEYS = {
  /**
   * System Owner Key
   * Value: User UUID who owns the entire system
   * Owner has wildcard (*) permissions globally
   */
  SYSTEM_OWNER: 'system:owner',
} as const;

/**
 * KV Store Namespace for Authorization
 */
export const AUTH_KV_NAMESPACE = 'authorization';
