/**
 * Organization adapters initialization
 * Bu dosya uygulama başlangıcında bir kez çağrılmalıdır
 */
import { CompanyOrganizationAdapter } from './adapters';
import { organizationRegistry } from './registry';

let isInitialized = false;

/**
 * Tüm organization adapter'larını register eder
 */
export function initializeOrganizationAdapters(): void {
  if (isInitialized) {
    return;
  }

  // Company adapter'ı default olarak register et
  organizationRegistry.register(new CompanyOrganizationAdapter(), true);

  // Buraya yeni adapter'lar eklenebilir:
  // organizationRegistry.register(new CompanyOrganizationAdapter());
  // organizationRegistry.register(new TeamOrganizationAdapter());

  isInitialized = true;
}
