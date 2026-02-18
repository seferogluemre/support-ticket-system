import { betterAuth } from '#modules/auth/authentication/instance.ts';
import prisma from '@onlyjs/db';
import { Elysia } from 'elysia';
import { UnauthorizedException } from '../../utils';
import { auditLogsController } from '../audit-logs';
import { PERMISSIONS, ensureUserHasPermission } from '../auth';
import { resetDatabaseDto } from './dto';
import { SystemAdministrationService } from './service';

const app = new Elysia({
  prefix: '/system-administration',
  detail: {
    tags: ['System Administration'],
  },
})
  .use(auditLogsController)
  .post(
    '/reset-database',
    async ({ request }) => {
      // Sistemde en az 1 user var mı kontrol et
      const userCount = await prisma.user.count();

      if (userCount > 0) {
        // User varsa authentication ve permission kontrolü yap
        const session = await betterAuth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          throw new UnauthorizedException();
        }

        // Permission kontrolü
        await ensureUserHasPermission(
          session.user,
          PERMISSIONS.SYSTEM_ADMINISTRATION.RESET_DATABASE,
        );
      }

      // User yoksa veya permission varsa işlemi yap
      const result = SystemAdministrationService.resetDatabase();
      return result;
    },
    resetDatabaseDto,
  );

export default app;
