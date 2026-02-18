import { api } from '#/lib/api';
import type { FileLibraryAssetIndexQuery } from '#backend/modules/file-library-assets/types';
import { FileLibraryAssetType } from '@onlyjs/db/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileLibraryAssetKeys, fileLibraryAssetsListQueryOptions } from '../queries/file-library-asset-queries';

// ====================================================================
// Type definitions
// ====================================================================
type CreateFileLibraryAssetInput = {
  file: File;
  type: FileLibraryAssetType;
};

type UpdateFileLibraryAssetInput = {
  uuid: string;
  name?: string;
  title?: string;
};

// ====================================================================
// 📁 FILE LIBRARY ASSETS HOOK
// ====================================================================
export function useFileLibraryAssets(filters?: FileLibraryAssetIndexQuery) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST (with pagination)
  // ====================================================================
  const {
    data: fileLibraryAssetsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...fileLibraryAssetsListQueryOptions(filters),
  });

  // ====================================================================
  // ➕ CREATE MUTATION
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (input: CreateFileLibraryAssetInput) => {
      const response = await api['file-library-assets'].post({
        file: input.file,
        type: input.type,
      });

      if (response.error) {
        throw new Error('Failed to create file library asset');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
  });

  // ====================================================================
  // ✏️ UPDATE MUTATION
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateFileLibraryAssetInput) => {
      const { uuid, ...data } = input;
      const response = await api['file-library-assets']({ uuid }).put(data);

      if (response.error) {
        throw new Error('Failed to update file library asset');
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.detail(variables.uuid) });
    },
  });

  // ====================================================================
  // 🗑️ DELETE MUTATION
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api['file-library-assets']({ uuid }).delete();

      if (response.error) {
        throw new Error('Failed to delete file library asset');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileLibraryAssetKeys.lists() });
    },
  });

  return {
    // State
    fileLibraryAssets: fileLibraryAssetsResponse?.data,
    meta: fileLibraryAssetsResponse?.meta,
    isLoading,
    error,

    // Query actions
    refetch,

    // Mutations
    createFileLibraryAsset: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateFileLibraryAsset: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteFileLibraryAsset: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}