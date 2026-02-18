import { DataTable } from '#/components/data-table';
import { PageContainer } from '#/components/layout/page-container';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { AuditLogAction, AuditLogEntity } from '#backend/modules/audit-logs/constants';
import { type PaginationState } from '@tanstack/react-table';
import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auditLogsColumns } from '../columns/audit-log.columns';
import { useAuditLogs } from '../hooks/use-audit-logs';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AuditLogsIndexPage() {
  // State for filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);
  const [actionTypeFilter, setActionTypeFilter] = useState<string | undefined>(undefined);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Reset pagination when debounced search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchKeyword]);

  // Fetch audit logs with filters and pagination
  const { auditLogs, meta, isLoading, refetch } = useAuditLogs({
    name: debouncedSearchKeyword || undefined,
    actionType: actionTypeFilter as typeof AuditLogAction[keyof typeof AuditLogAction] | undefined,
    entityType: entityTypeFilter as typeof AuditLogEntity[keyof typeof AuditLogEntity] | undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    orderBy,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  // Handle pagination change
  const handlePaginationChange = (updater: React.SetStateAction<PaginationState>) => {
    setPagination(updater);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setActionTypeFilter(undefined);
    setEntityTypeFilter(undefined);
    setStartDate('');
    setEndDate('');
    setOrderBy('desc');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          View system audit logs. Track user actions and changes across the application.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Search by user name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">User Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name..."
              className="pl-9 w-64"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Action Type</label>
          <Select
            value={actionTypeFilter || 'all'}
            onValueChange={(value) => {
              setActionTypeFilter(value === 'all' ? undefined : value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.values(AuditLogAction).map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
          <Select
            value={entityTypeFilter || 'all'}
            onValueChange={(value) => {
              setEntityTypeFilter(value === 'all' ? undefined : value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {Object.values(AuditLogEntity).map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Start Date</label>
          <Input
            type="datetime-local"
            className="w-[200px]"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">End Date</label>
          <Input
            type="datetime-local"
            className="w-[200px]"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>

        {/* Order By */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
          <Select
            value={orderBy}
            onValueChange={(value: 'asc' | 'desc') => {
              setOrderBy(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters Button */}
        <Button variant="outline" onClick={handleResetFilters} className="h-10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

        {/* Refresh Button */}
        <Button variant="outline" onClick={() => refetch()} className="h-10">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={auditLogsColumns}
            data={auditLogs || []}
            isLoading={isLoading}
            manualPagination
            pageCount={meta?.pageCount ?? -1}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            emptyMessage="No audit logs found."
          />
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {meta && (
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
          {meta.total} audit logs
        </div>
      )}
      </div>
    </PageContainer>
  );
}