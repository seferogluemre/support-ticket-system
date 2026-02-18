import { cron } from '@elysiajs/cron';
import { Elysia, type AnyElysia } from 'elysia';
import { AuditLogService } from './service';

export const auditLogsCron: AnyElysia = new Elysia().use(
  cron({
    name: 'cleanup-audit-logs',
    pattern: '0 0 * * *', // Her gün gece yarısı
    run: async () => {
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const result = await AuditLogService.deleteOldLogs(ninetyDaysAgo);
        console.info(`Deleted ${result.count} old audit logs`);
      } catch (error) {
        console.error('Failed to cleanup audit logs:', error);
      }
    },
  }),
);
