/* eslint-disable no-console */
import { createSeeder } from '@onlyjs/db/seeder/utils';
import { CompanyService } from '../modules/companies/service';

const companySeeder = createSeeder(
  {
    name: 'company',
    description: "Test company oluşturur",
    priority: 10, // System initialization'dan sonra çalışsın
    dependencies: ['system-initialization'],
  },
  async (prisma) => {
    // Test company'i kontrol et
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: 'Test Company',
        deletedAt: null,
      },
    });

    if (existingCompany) {
      console.log('✅ Test company already exists');
      return;
    }

    // System admin user'ı bul (owner olarak atanacak)
    const systemAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
      },
    });

    if (!systemAdmin) {
      throw new Error('⚠️ System admin not found, cannot create company without owner');
    }

    // CompanyService kullanarak company oluştur
    // Bu otomatik olarak CompanyChatExt ve default BASIC/ADMIN rollerini oluşturur
    const company = await CompanyService.store({
      name: 'Test Company',
      ownerUserId: systemAdmin.id,
    });

    console.log('✅ Created test company:', company.name);
    console.log('✅ Created CompanyChatExt with default config and auto-generated token');
    console.log('✅ Created default BASIC and ADMIN roles');
    console.log('✅ Company owner set:', systemAdmin.email);
    console.log('🎉 Company seeding completed!');
  },
  async (prisma) => {
    // Rollback - Test company'i sil
    await prisma.company.deleteMany({
      where: {
        name: 'Test Company',
      },
    });

    console.log('✅ Company rollback completed!');
  },
);

export default companySeeder;
