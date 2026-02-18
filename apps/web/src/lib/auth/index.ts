/**
 * Authentication & Authorization Library
 *
 * Centralized authentication and authorization utilities.
 *
 * ## Structure
 *
 * - `client.ts` - Better Auth client configuration
 * - `permissions/` - Permission checking system (checks, helpers, hooks)
 *
 * ## Usage
 *
 * ```ts
 * // Auth client
 * import { authClient } from '#lib/auth';
 *
 * // Permission utilities
 * import {
 *   hasPermission,
 *   checkPermission,
 *   usePermission
 * } from '#lib/auth';
 * ```
 */

// Re-export auth client
export { authClient } from './client';

// Re-export all permission utilities
export * from './permissions';