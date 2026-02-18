import type { OrganizationType } from '@onlyjs/db/enums';
import { PERMISSION_GROUPS, PERMISSION_KEYS, PERMISSIONS } from './constants';
import type { GenericPermissionObject, PermissionKey } from './types';
import { getFilteredPermissionGroups, getPermissionsForOrganizationType } from './validators';

export abstract class PermissionsService {
  /**
   * Tüm permission'ları döndürür (opsiyonel olarak organizationType'a göre filtrele)
   */
  static async index(organizationType?: OrganizationType | null): Promise<PermissionKey[]> {
    const orgType = organizationType === undefined ? null : organizationType;
    
    if (orgType === null) {
      // Tüm permission'lar
      return PERMISSION_KEYS;
    }
    
    // Organization türüne göre filtrelenmiş permission'lar
    return getPermissionsForOrganizationType(orgType);
  }

  /**
   * Permission gruplarını döndürür (opsiyonel olarak organizationType'a göre filtrele)
   */
  static async getGroups(organizationType?: OrganizationType | null): Promise<{
    [key: string]: {
      key: string;
      description: string;
      permissions: GenericPermissionObject[];
    };
  }> {
    const orgType = organizationType === undefined ? null : organizationType;
    
    if (orgType === null) {
      // Tüm gruplar
      return PERMISSION_GROUPS;
    }
    
    // Organization türüne göre filtrelenmiş gruplar
    return getFilteredPermissionGroups(orgType);
  }

  /**
   * Permission detayını döndürür
   */
  static async show(permissionKey: PermissionKey): Promise<GenericPermissionObject | null> {
    const allPermissions = Object.values(PERMISSIONS).flatMap((module) => Object.values(module));
    return allPermissions.find((perm) => perm.key === permissionKey) || null;
  }
}


