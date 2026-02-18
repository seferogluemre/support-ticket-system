import { api } from '#/lib/api';
import type { FileLibraryAssetIndexQuery, FileLibraryAssetShowResponse } from '#backend/modules/file-library-assets/types';
import { queryOptions } from '@tanstack/react-query';

// ====================================================================
// Query Keys
// ====================================================================
export const fileLibraryAssetKeys = {
  all: ['file-library-assets'] as const,
  lists: () => [...fileLibraryAssetKeys.all, 'list'] as const,
  list: (filters?: FileLibraryAssetIndexQuery) => [...fileLibraryAssetKeys.lists(), filters] as const,
  details: () => [...fileLibraryAssetKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...fileLibraryAssetKeys.details(), uuid] as const,
};

// ====================================================================
// 📋 FILE LIBRARY ASSETS LIST QUERY
// ====================================================================
export const fileLibraryAssetsListQueryOptions = (filters?: FileLibraryAssetIndexQuery) =>
  queryOptions({
    queryKey: fileLibraryAssetKeys.list(filters),
    queryFn: async () => {
      const response = await api['file-library-assets'].get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch file library assets');
      }

      return response.data;
    },
  });

// ====================================================================
// 🔍 FILE LIBRARY ASSET DETAIL QUERY
// ====================================================================
export const fileLibraryAssetDetailQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: fileLibraryAssetKeys.detail(uuid),
    queryFn: async () => {
      const response = await api['file-library-assets']({ uuid }).get();

      if (response.error) {
        throw new Error('Failed to fetch file library asset');
      }

      return response.data as FileLibraryAssetShowResponse;
    },
    enabled: !!uuid,
  });