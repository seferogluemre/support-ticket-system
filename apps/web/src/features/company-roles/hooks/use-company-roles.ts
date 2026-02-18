import { api } from '#/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { companyRolesListQueryOptions } from '../queries/role-queries';
import type { CompanyRoleCreatePayload, CompanyRoleFilters, CompanyRoleUpdatePayload } from '../types';

/**
 * Company Roles Hook
 *
 * Provides methods to fetch, create, update, delete company roles
 * Uses react-query for caching and state management
 */
export function useCompanyRoles(companyUuid: string, filters?: CompanyRoleFilters) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST
  // ====================================================================
  const {
    data: companyRoles,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyRolesListQueryOptions(companyUuid, filters),
  });

  // ====================================================================
  // ➕ CREATE
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (payload: CompanyRoleCreatePayload) => {
      const response = await api.auth.roles.post(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create company role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate company roles queries
      queryClient.invalidateQueries({
        queryKey: ['company-roles', companyUuid],
      });
      toast.success('Company role created successfully');
    },
    onError: (error) => {
      console.error('Failed to create company role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create company role');
    },
  });

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({ uuid, payload }: { uuid: string; payload: CompanyRoleUpdatePayload }) => {
      const response = await api.auth.roles({ uuid }).patch(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update company role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { uuid }) => {
      // Invalidate company roles queries
      queryClient.invalidateQueries({
        queryKey: ['company-roles', companyUuid],
      });
      // Invalidate specific role query
      queryClient.invalidateQueries({
        queryKey: ['company-role', uuid],
      });
      // Invalidate role members query
      queryClient.invalidateQueries({
        queryKey: ['company-role-members', uuid],
      });
      toast.success('Company role updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update company role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update company role');
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api.auth.roles({ uuid }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete company role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate company roles queries
      queryClient.invalidateQueries({
        queryKey: ['company-roles', companyUuid],
      });
      toast.success('Company role deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete company role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete company role');
    },
  });

  return {
    // State
    companyRoles,
    isLoading,
    error,

    // Actions
    createCompanyRole: createMutation.mutate,
    createCompanyRoleAsync: createMutation.mutateAsync,
    updateCompanyRole: updateMutation.mutate,
    updateCompanyRoleAsync: updateMutation.mutateAsync,
    deleteCompanyRole: deleteMutation.mutate,
    deleteCompanyRoleAsync: deleteMutation.mutateAsync,
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
