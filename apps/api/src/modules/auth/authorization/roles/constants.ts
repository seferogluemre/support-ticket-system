import { RoleType } from '@onlyjs/db/enums';
import type { DefaultRoleDefinition } from '../organizations/base-adapter';
import { PERMISSIONS } from '../permissions/constants';

/**
 * Global Default Role Definitions - System Initialization
 * Bu roller sistem ilk kurulumunda oluşturulur ve silinemez
 */
export const GLOBAL_DEFAULT_ROLES = {
  BASIC: {
    type: RoleType.BASIC,
    name: 'User',
    description: 'Basic user with limited system access',
    permissions: [
      // Kendi profilini görüntüleyebilir
      PERMISSIONS.USER_BASIC.SHOW.key,
    ],
    order: 1,
  },
  ADMIN: {
    type: RoleType.ADMIN,
    name: 'System Owner',
    description: 'System administrator with full access (cannot be deleted)',
    permissions: [
      // Wildcard - tüm yetkilere sahip
      '*',
    ],
    order: 1000, // En yüksek hierarchy
  },
} as const;

/**
 * Company (Organization) Default Role Definitions
 * Her company oluşturulduğunda bu roller otomatik oluşturulur
 */
export const COMPANY_DEFAULT_ROLES = {
  BASIC: {
    type: 'BASIC' as const,
    name: 'Member',
    description: 'Basic member with limited access',
    permissions: [
      // Core permissions comes here
    ],
    order: 1,
  },
  ADMIN: {
    type: 'ADMIN' as const,
    name: 'Company Admin',
    description: 'Company administrator with full organization access',
    permissions: [
      // Organization scope için wildcard
      // Note: Owner'lar zaten tüm yetkilere sahip olacak
      '*',
    ],
    order: 100, // En yüksek organization hierarchy
  },
} satisfies Record<string, DefaultRoleDefinition>;
