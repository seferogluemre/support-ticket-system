import type { Simplify, ValueOf } from 'type-fest';
import type { OrganizationType } from '@onlyjs/db/enums';
import { PERMISSIONS } from './constants';

export type Permission = string;

/**
 * Permission Scope: 'global' + tüm organization türleri
 * Yeni organization türü eklendiğinde otomatik olarak scope'a eklenir
 */
export type PermissionScope = 'global' | OrganizationType;

// Recursive dependency type for nested AND/OR operations
export type PermissionDependency = 
  | string 
  | string[] // Default to AND operation
  | { and: PermissionDependency[] }
  | { or: PermissionDependency[] };

export type GenericPermissionObject = {
  key: string;
  description: string;
  /**
   * Permission'ın hangi scope'larda kullanılabileceğini belirtir.
   * 
   * - `['global']`: Sadece global roller için (organization-specific rollerde kullanılamaz)
   * - `[OrganizationType.COMPANY]`: Sadece COMPANY organization'larına atanmış rollerde kullanılabilir
   * - `['global', OrganizationType.COMPANY]`: Hem global hem de COMPANY rollerinde kullanılabilir
   * 
   * ⚠️ ZORUNLU: Her permission'un mutlaka scopes tanımı olmalıdır.
   * 
   * @example
   * // Global-only permission
   * { key: 'users:impersonate', scopes: ['global'] }
   * 
   * // Organization-only permission
   * { key: 'conversations:list', scopes: [OrganizationType.COMPANY] }
   *
   * // Multi-scope permission (both global and org-specific roles can use it)
   * { key: 'posts:show', scopes: ['global', OrganizationType.COMPANY] }
   */
  scopes: PermissionScope[];
  /**
   * Permission'ın hangi permission'lara bağımlı olduğunu belirtir.
   * Scope'a göre farklı bağımlılıklar tanımlanabilir.
   * AND/OR operatörleri ile bağımlılık mantığı belirtilebilir.
   * İç içe geçmiş AND/OR operatörleri desteklenir.
   * 
   * @example
   * // Tek bağımlılık (tüm scope'larda aynı)
   * { key: 'user-basic:update-password', dependsOn: 'user-basic:update-profile' }
   * 
   * // Çoklu bağımlılık - AND operatörü (varsayılan)
   * { key: 'complex-permission', dependsOn: ['permission-1', 'permission-2'] }
   * 
   * // Çoklu bağımlılık - AND operatörü (explicit)
   * { key: 'complex-permission', dependsOn: { and: ['permission-1', 'permission-2'] } }
   * 
   * // Çoklu bağımlılık - OR operatörü
   * { key: 'flexible-permission', dependsOn: { or: ['permission-1', 'permission-2'] } }
   * 
   * // İç içe geçmiş operatörler
   * { 
   *   key: 'complex-permission', 
   *   dependsOn: { 
   *     and: [
   *       'permission-1',
   *       { or: ['permission-2', 'permission-3'] },
   *       { and: ['permission-4', 'permission-5'] }
   *     ]
   *   }
   * }
   * 
   * // Scope'a göre farklı bağımlılıklar
   * { 
   *   key: 'role-assign', 
   *   dependsOn: {
   *     'global': ['user-basic:show', 'role-view:list-globals'], // Default AND
   *     [OrganizationType.COMPANY]: { or: ['user-basic:show', 'role-view:list-globals'] }
   *   }
   * }
   */
  dependsOn?: PermissionDependency | Partial<Record<PermissionScope, PermissionDependency>>;
  /**
   * Permission'ın UI'da hangi scope'larda gizli olacağını belirtir.
   * 
   * - `true`: Tüm scope'larda gizli (internal/system permissions)
   * - `['global']`: Sadece global scope'ta gizli
   * - `[OrganizationType.COMPANY]`: Sadece COMPANY scope'ta gizli
   * - `undefined`: Hiçbir scope'ta gizli değil
   * 
   * @example
   * // Tüm scope'larda gizli
   * { hiddenOn: true }
   * 
   * // Sadece global'de gizli
   * { hiddenOn: ['global'] }
   * 
   * // Hiçbir yerde gizli değil
   * { hiddenOn: undefined }
   */
  hiddenOn?: true | PermissionScope[];
};

export type BasePermissionObject = Simplify<
  ValueOf<{
    [K in keyof typeof PERMISSIONS]: ValueOf<(typeof PERMISSIONS)[K]>;
  }>
>;

export type PermissionObject =
  | BasePermissionObject
  | {
      key: '*';
      description: 'Tüm yetkilere izin ver';
    };

export type PermissionKey = BasePermissionObject['key'] | '*';

export type PermissionIdentifier = PermissionKey | PermissionObject;
