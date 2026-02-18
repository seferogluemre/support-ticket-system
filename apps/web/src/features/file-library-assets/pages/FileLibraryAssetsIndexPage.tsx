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
import type { FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { type PaginationState } from '@tanstack/react-table';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileLibraryAssetColumns } from '../columns/file-library-asset.columns';
import { FileDeleteModal, FileEditModal, FileUploadModal, FileViewModal } from '../components';
import { useFileLibraryAssets } from '../hooks/use-file-library-assets';

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

// File type options for filter
const FILE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'IMAGE', label: 'Images' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'DOCUMENT', label: 'Documents' },
];

export default function FileLibraryAssetsIndexPage() {
  // Filter states
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 300);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FileLibraryAssetShowResponse | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, fileTypeFilter]);

  // Fetch file library assets
  const {
    fileLibraryAssets,
    meta,
    isLoading,
    refetch,
    createFileLibraryAsset,
    isCreating,
    updateFileLibraryAsset,
    isUpdating,
    deleteFileLibraryAsset,
    isDeleting,
  } = useFileLibraryAssets({
    name: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  // Filter by file type on client side (since API might not have this filter)
  const filteredAssets = useMemo(() => {
    if (!fileLibraryAssets) return [];
    if (fileTypeFilter === 'all') return fileLibraryAssets;
    return fileLibraryAssets.filter(asset => asset.fileType === fileTypeFilter);
  }, [fileLibraryAssets, fileTypeFilter]);

  // Action handlers
  const handleView = useCallback((asset: FileLibraryAssetShowResponse) => {
    setSelectedAsset(asset);
    setViewModalOpen(true);
  }, []);

  const handleEdit = useCallback((asset: FileLibraryAssetShowResponse) => {
    setSelectedAsset(asset);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((asset: FileLibraryAssetShowResponse) => {
    setSelectedAsset(asset);
    setDeleteModalOpen(true);
  }, []);

  // CRUD operations
  const handleUpload = async (file: File, type: import('@onlyjs/db/client').FileLibraryAssetType) => {
    await createFileLibraryAsset({ file, type });
  };

  const handleSaveEdit = async (uuid: string, data: { name?: string; title?: string }) => {
    await updateFileLibraryAsset({ uuid, ...data });
  };

  const handleConfirmDelete = async (uuid: string) => {
    await deleteFileLibraryAsset(uuid);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setFileTypeFilter('all');
    setPagination({ pageIndex: 0, pageSize: 20 });
  };

  // Create columns with actions
  const columns = useMemo(
    () => createFileLibraryAssetColumns({
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
    }),
    [handleView, handleEdit, handleDelete]
  );

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">File Library</h1>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage your uploaded files including images, videos, and documents.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-9 w-64"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">File Type</label>
            <Select
              value={fileTypeFilter}
              onValueChange={setFileTypeFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleResetFilters} className="h-10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="h-10">
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredAssets}
              isLoading={isLoading}
              manualPagination
              pageCount={meta?.pageCount ?? -1}
              pagination={pagination}
              onPaginationChange={setPagination}
              emptyMessage="No files found."
            />
          </CardContent>
        </Card>

        {/* Pagination Info */}
        {meta && (
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, meta.total)} of{' '}
            {meta.total} files
          </div>
        )}

        {/* Modals */}
        <FileUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleUpload}
          isUploading={isCreating}
        />

        <FileEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          asset={selectedAsset}
          onSave={handleSaveEdit}
          isSaving={isUpdating}
        />

        <FileDeleteModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          asset={selectedAsset}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />

        <FileViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          asset={selectedAsset}
        />
      </div>
    </PageContainer>
  );
}