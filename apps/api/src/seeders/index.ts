// API Seeders - Dynamic Exports
// Tüm API seeder'ları dinamik import ile yüklenir (circular dependency önlemek için)

import type { Seeder } from '@onlyjs/db/seeder/interfaces';

// Dinamik import ile seeder'ları yükle
export async function loadApiSeeders(): Promise<Seeder[]> {
  const seeders: Seeder[] = [];

  try {
    const systemAdminModule = await import('./system-initialization.seeder');
    seeders.push(systemAdminModule.default);
  } catch (error) {
    console.warn('⚠️ Failed to load system-initialization seeder:', error);
  }

  try {
    const worldDataModule = await import('./world-data.seeder');
    seeders.push(worldDataModule.default);
  } catch (error) {
    console.warn('⚠️ Failed to load world-data seeder:', error);
  }

  try {
    const usersModule = await import('./users.seeder');
    seeders.push(usersModule.default);
  } catch (error) {
    console.warn('⚠️ Failed to load users seeder:', error);
  }

  try {
    const companyModule = await import('./company.seeder');
    seeders.push(companyModule.default);
  } catch (error) {
    console.warn('⚠️ Failed to load company seeder:', error);
  }

  return seeders.filter(Boolean);
}
