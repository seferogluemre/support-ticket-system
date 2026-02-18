// ============================================================================
// PUBLIC API - Only safe exports to prevent circular dependencies
// ============================================================================

// Constants (safe - no dependencies)
export * from './constants';

// Types (safe - type-only exports)
export type * from './types';

// Base Adapter (for extending - required for adapter implementations)
export * from './base-adapter';

// Registry (safe - direct access)
export { organizationRegistry } from './registry';

// ============================================================================
// NOT EXPORTED - Import directly from specific files to avoid circular deps:
// ============================================================================
// - './service' → Import from './service.ts' directly
// - './helpers' → Import from './helpers.ts' directly  
// - './dtos' → Import from './dtos.ts' directly (used in controllers)
