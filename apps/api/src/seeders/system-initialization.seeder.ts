import { KVStoreService } from '#core';
import { Gender, RoleType, UserScope } from '@onlyjs/db/enums';
import { createSeeder } from '@onlyjs/db/seeder/utils';
import { AUTH_KV_KEYS, AUTH_KV_NAMESPACE } from '../modules/auth/authorization/constants';
import { GLOBAL_DEFAULT_ROLES } from '../modules/auth/authorization/roles/constants';
import { UsersService } from '../modules/users';

const systemInitializationSeeder = createSeeder(
  {
    name: 'system-initialization',
    description: 'Sistem initialization: roles, admin user, system owner',
    priority: 1, // En önce çalışacak
  },
  async (prisma) => {
    // biome-ignore lint: Seeder log output is intentional
    console.log('🚀 Starting system initialization...');

    try {
      // Check if already initialized
      const usersCount = await prisma.user.count();
      if (usersCount > 0) {
        // biome-ignore lint: Seeder log output is intentional
        console.log('⏭️  System already initialized (users exist)');
        // Return the existing admin user
        const adminUser = await prisma.user.findFirst({
          where: { email: 'admin@example.com' },
        });
        if (!adminUser) {
          throw new Error('System initialized but admin user not found');
        }
      }

      // 1. Create BASIC role (transaction dışında - commit olsun)
      const basicRole = await prisma.role.create({
        data: {
          type: RoleType.BASIC,
          name: GLOBAL_DEFAULT_ROLES.BASIC.name,
          description: GLOBAL_DEFAULT_ROLES.BASIC.description,
          permissions: GLOBAL_DEFAULT_ROLES.BASIC.permissions,
          order: GLOBAL_DEFAULT_ROLES.BASIC.order,
          organizationType: null,
          organizationId: null,
        },
      });
      // biome-ignore lint: Seeder log output is intentional
      console.log(`✅ BASIC role ready: ${basicRole.name}`);

      // 2. Create ADMIN role (transaction dışında - commit olsun)
      const adminRole = await prisma.role.create({
        data: {
          type: RoleType.ADMIN,
          name: GLOBAL_DEFAULT_ROLES.ADMIN.name,
          description: GLOBAL_DEFAULT_ROLES.ADMIN.description,
          permissions: GLOBAL_DEFAULT_ROLES.ADMIN.permissions,
          order: GLOBAL_DEFAULT_ROLES.ADMIN.order,
          organizationType: null,
          organizationId: null,
        },
      });
      // biome-ignore lint: Seeder log output is intentional
      console.log(`✅ ADMIN role ready: ${adminRole.name}`);

      // 3. Better-auth ile kullanıcı oluştur (role validation bypass for seeding)
      const createdUser = await UsersService.store({
        email: 'admin@example.com',
        password: 'password',
        firstName: 'System',
        lastName: 'Administrator',
        gender: Gender.MALE,
        scope: UserScope.SYSTEM, // System-level access
        roleUuids: [adminRole.uuid],
      }, prisma, true); // skipRoleValidation = true for seeding
      // biome-ignore lint: Seeder log output is intentional
      console.log(`✅ System admin user created: ${createdUser.email}`);

      // 4. Set system owner in KV store
      await KVStoreService.set(AUTH_KV_KEYS.SYSTEM_OWNER, createdUser.id, {
        namespace: AUTH_KV_NAMESPACE,
        description: 'System owner user UUID - has global wildcard (*) permissions',
        tags: ['system', 'owner', 'authorization'],
        ttl: 0, // Never expires
      });
      // biome-ignore lint: Seeder log output is intentional
      console.log(`✅ System owner set in KV store: ${createdUser.id}`);

      // biome-ignore lint: Seeder log output is intentional
      console.log('🎉 System initialization completed!');
    } catch (error) {
      console.error('❌ Error in system initialization:', error);
      throw error;
    }
  },
);

export default systemInitializationSeeder;
