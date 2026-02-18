import type { AuditLogIndexQuery } from '#backend/modules/audit-logs/types';
import { useQuery } from '@tanstack/react-query';
import { auditLogsListQueryOptions } from '../queries/audit-log-queries';

/**
 * Audit Logs Hook
 *
 * Provides methods to fetch audit logs (read-only)
 * Uses react-query for caching and state management
 */
export function useAuditLogs(filters?: AuditLogIndexQuery) {
  // ====================================================================
  // 📋 GET LIST (with pagination)
  // ====================================================================
  const {
    data: auditLogsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...auditLogsListQueryOptions(filters),
  });

  return {
    // State
    auditLogs: auditLogsResponse?.data,
    meta: auditLogsResponse?.meta,
    isLoading,
    error,

    // Actions
    refetch,
  };
}