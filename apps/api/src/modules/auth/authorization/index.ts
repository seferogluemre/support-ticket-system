// Initialize organization adapters
import { initializeOrganizationAdapters } from './organizations/setup';
initializeOrganizationAdapters();

// Permissions
export * from './permissions';

// Claims
export * from './claims';

// Roles
export * from './roles';

// User Permissions
export * from './user-permissions';

// Organizations (PermissionScope zaten permissions'dan export ediliyor)
export * from './organizations/constants';
export { organizationRegistry } from './organizations/registry';
export type { OrganizationAdapter } from './organizations/types';

// Middleware
export * from './middleware';
