import { api } from '#/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { companiesListQueryOptions } from '../queries/company-queries';
import type {
    CompanyCreatePayload,
    CompanyFilters,
    CompanyUpdatePayload,
} from '../types';

/**
 * Companies Hook
 *
 * Provides methods to fetch, create, update, delete companies
 * Uses react-query for caching and state management
 */
export function useCompanies(filters?: CompanyFilters) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST
  // ====================================================================
  const {
    data: companies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companiesListQueryOptions(filters),
  });

  // ====================================================================
  // ➕ CREATE
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (payload: CompanyCreatePayload) => {
      const response = await api.companies.post(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create company';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['companies'],
      });
      toast.success('Company created successfully');
    },
    onError: (error) => {
      console.error('Failed to create company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create company');
    },
  });

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({
      companyUuid,
      payload,
    }: {
      companyUuid: string;
      payload: CompanyUpdatePayload;
    }) => {
      const response = await api
        .companies({ uuid: companyUuid })
        .patch(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update company';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { companyUuid }) => {
      queryClient.invalidateQueries({
        queryKey: ['companies'],
      });
      queryClient.invalidateQueries({
        queryKey: ['company', companyUuid],
      });
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update company');
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (companyUuid: string) => {
      const response = await api
        .companies({ uuid: companyUuid })
        .delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete company';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['companies'],
      });
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete company');
    },
  });

  return {
    // State
    companies,
    isLoading,
    error,

    // Actions
    createCompany: createMutation.mutate,
    createCompanyAsync: createMutation.mutateAsync,
    updateCompany: updateMutation.mutate,
    updateCompanyAsync: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutate,
    deleteCompanyAsync: deleteMutation.mutateAsync,
    refetch,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
