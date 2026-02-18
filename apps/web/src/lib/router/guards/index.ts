/**
 * Route Guards - Main Export
 *
 * This file exports router-specific guard functionality.
 */

// ============================================================================
// Guard System (Router-Specific)
// ============================================================================

export {
  // Guard system
  guards,
  // Types
  type AppRouteContext,
  type AppCompany,
} from './config';

// ============================================================================
// Guard Options (for type safety)
// ============================================================================

export type {
  // Generic guard options
  PermissionGuardOptions,
} from './core';

export type {
  // Company-specific guard options
  CompanyPermissionGuardOptions,
} from './adapters';

// ============================================================================
// Core Types (for advanced usage)
// ============================================================================

export type {
  GuardHelpers,
  RouteGuardResult,
  BaseSession,
} from './core/index';
