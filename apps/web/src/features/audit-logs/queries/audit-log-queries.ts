import { api } from '#/lib/api';
import type { AuditLogIndexQuery, AuditLogIndexResponse } from '#backend/modules/audit-logs/types';
import { queryOptions } from '@tanstack/react-query';

/**
 * Query Options for Audit Logs
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 AUDIT LOGS LIST QUERY (with pagination)
// ====================================================================
export const auditLogsListQueryOptions = (filters?: AuditLogIndexQuery) =>
  queryOptions({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      // Access the nested audit-logs endpoint under system-administration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const auditLogsApi = (api['system-administration'] as any)['audit-logs'];

      const response = await auditLogsApi.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch audit logs');
      }

      return response.data as AuditLogIndexResponse;
    },
  });