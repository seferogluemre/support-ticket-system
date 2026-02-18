import type { OrganizationType } from '@onlyjs/db/enums';
import type { OrganizationAdapter } from './types';

/**
 * Organization adapter registry
 * Yeni organization türleri buraya register edilir
 */
export class OrganizationAdapterRegistry {
  private adapters = new Map<OrganizationType, OrganizationAdapter>();
  private defaultAdapter: OrganizationAdapter | null = null;

  /**
   * Yeni bir organization adapter register eder
   */
  register(adapter: OrganizationAdapter, isDefault = false): void {
    this.adapters.set(adapter.organizationType as OrganizationType, adapter);

    if (isDefault) {
      this.defaultAdapter = adapter;
    }
  }

  /**
   * Organization türüne göre adapter getirir
   */
  get(organizationType: OrganizationType | string): OrganizationAdapter | null {
    return this.adapters.get(organizationType as OrganizationType) || null;
  }

  /**
   * Default adapter'ı getirir
   */
  getDefault(): OrganizationAdapter {
    if (!this.defaultAdapter) {
      throw new Error('No default organization adapter registered');
    }
    return this.defaultAdapter;
  }

  /**
   * Tüm register edilmiş adapter'ları getirir
   */
  getAll(): OrganizationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Organization türü register edilmiş mi kontrol eder
   */
  has(organizationType: OrganizationType | string): boolean {
    return this.adapters.has(organizationType as OrganizationType);
  }
}

// Global registry instance
export const organizationRegistry = new OrganizationAdapterRegistry();
