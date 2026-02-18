/**
 * Router Library
 *
 * Centralized router utilities including guards and route configuration helpers.
 *
 * ## Structure
 *
 * - `guards/` - Route guard system
 * - `utilities/` - Route configuration factories and loaders
 */

// Re-export guards
export * from './guards';
export { guards as default } from './guards/config';

// Re-export utilities
export * from './utilities/route-factories';
export * from './utilities/route-loaders';