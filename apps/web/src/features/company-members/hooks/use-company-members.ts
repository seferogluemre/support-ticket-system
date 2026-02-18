import { api } from '#/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { companyMembersListQueryOptions } from '../queries/company-member-queries';
import type {
  CompanyMemberCreatePayload,
  CompanyMemberUpdatePayload,
} from '../types';

/**
 * Company Members Hook
 *
 * Provides methods to fetch, create, and manage company members
 * Uses react-query for caching and state management
 */
export function useCompanyMembers(companyUuid: string) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST
  // ====================================================================
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...companyMembersListQueryOptions(companyUuid),
    enabled: !!companyUuid,
  });

  // ====================================================================
  // ➕ CREATE MEMBER
  // ====================================================================
  const createMemberMutation = useMutation({
    mutationFn: async (payload: CompanyMemberCreatePayload) => {
      if (!companyUuid) {
        throw new Error('Company UUID is required');
      }

      // POST /organizations/company/:organizationUuid/members
      const response = await api.auth.organizations
        .company({ organizationUuid: companyUuid })
        .members.post(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create member';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      if (companyUuid) {
        queryClient.invalidateQueries({
          queryKey: companyMembersListQueryOptions(companyUuid).queryKey,
        });
      }
      toast.success('Member created successfully');
    },
    onError: (error) => {
      console.error('Failed to create member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create member');
    },
  });

  // ====================================================================
  // ✏️ UPDATE MEMBER
  // ====================================================================
  const updateMemberMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: CompanyMemberUpdatePayload }) => {
      if (!companyUuid) {
        throw new Error('Company UUID is required');
      }

      const response = await api.auth.organizations
        .company({ organizationUuid: companyUuid })
        .members({ userId })
        .put(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update member';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      if (companyUuid) {
        queryClient.invalidateQueries({
          queryKey: companyMembersListQueryOptions(companyUuid).queryKey,
        });
      }
      toast.success('Member updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update member');
    },
  });

  // ====================================================================
  // 🗑️ REMOVE MEMBER
  // ====================================================================
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!companyUuid) {
        throw new Error('Company UUID is required');
      }

      // DELETE /organizations/:organizationType/:organizationUuid/members/:userId
      const response = await api.auth
        .organizations({ organizationType: 'company' })({ organizationUuid: companyUuid })
        .members({ userId })
        .delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to remove member';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      if (companyUuid) {
        queryClient.invalidateQueries({
          queryKey: companyMembersListQueryOptions(companyUuid).queryKey,
        });
      }
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      console.error('Failed to remove member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    },
  });

  return {
    // State
    members,
    isLoading,
    error,

    // Actions
    createMember: createMemberMutation.mutate,
    createMemberAsync: createMemberMutation.mutateAsync,
    updateMember: updateMemberMutation.mutate,
    updateMemberAsync: updateMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutate,
    removeMemberAsync: removeMemberMutation.mutateAsync,
    refetch,

    // Mutation states
    isCreating: createMemberMutation.isPending,
    isUpdating: updateMemberMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    createError: createMemberMutation.error,
    updateError: updateMemberMutation.error,
    removeError: removeMemberMutation.error,
  };
}