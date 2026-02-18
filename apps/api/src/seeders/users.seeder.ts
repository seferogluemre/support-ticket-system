import { faker } from '@faker-js/faker';
import { Gender } from '@onlyjs/db/enums';
import { createSeeder } from '@onlyjs/db/seeder/utils';

const usersSeeder = createSeeder(
  {
    name: 'users',
    description: 'Sahte kullanıcı verilerini oluşturur',
    priority: 20,
    dependencies: ['system-initialization'], // System initialization'dan sonra çalışsın
  },
  async (prisma) => {
    // Basic role'ü bul (global scope)
    const userRole = await prisma.role.findFirst({
      where: { 
        name: 'User',
        type: 'BASIC',
        organizationType: null,
      },
    });

    if (!userRole) {
      throw new Error('User role not found. Please run roles seeder first.');
    }

    // Create users
    const users = await Promise.all(
      Array(50)
        .fill(null)
        .map(() => {
          const firstName = faker.person.firstName().slice(0, 50);
          const lastName = faker.person.lastName().slice(0, 50);
          return prisma.user.create({
            data: {
              firstName,
              lastName,
              name: `${firstName} ${lastName}`.slice(0, 101),
              email: faker.internet.email().slice(0, 255),
              gender: faker.helpers.arrayElement(Object.values(Gender)),
              emailVerified: true,
              image: faker.image.avatar().slice(0, 255),
            },
          });
        }),
    );

    // UserRole'leri oluştur
    await Promise.all(
      users.map((user) =>
        prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: userRole.id,
          },
        }),
      ),
    );

    console.log('✅ Users seeding completed!');
  },
  async (prisma) => {
    // Rollback - basic rolüne sahip kullanıcıları bul ve sil
    const basicRole = await prisma.role.findFirst({
      where: { 
        name: 'User',
        type: 'BASIC',
        organizationType: null,
      },
    });

    if (basicRole) {
      const userRoles = await prisma.userRole.findMany({
        where: { roleId: basicRole.id },
        select: { userId: true },
      });

      await prisma.user.deleteMany({
        where: {
          id: {
            in: userRoles.map((ur) => ur.userId),
          },
        },
      });
    }

    console.log('✅ Users rollback completed!');
  },
);

export default usersSeeder;
