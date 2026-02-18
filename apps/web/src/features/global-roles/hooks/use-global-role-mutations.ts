/**
 * Global Role Mutations Hook
 * Provides mutation functions for creating, updating, and deleting global roles
 */

import { api } from '#/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateGlobalRoleInput, UpdateGlobalRoleInput } from '../types';

/**
 * Hook for global role mutations (create, update, delete)
 */
export function useGlobalRoleMutations() {
  const queryClient = useQueryClient();

  // Create global role mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGlobalRoleInput) => {
      // biome-ignore lint/suspicious/noExplicitAny: Eden API type inference issue
      const response = await api.auth.roles.post({
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        order: data.order,
        permissions: data.permissions,
        // Global roles have no organization
        organizationType: undefined,
        organizationUuid: undefined,
      } as any);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create global role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-roles'] });
      toast.success('Global role created successfully');
    },
    onError: (error) => {
      console.error('Failed to create global role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create global role');
    },
  });

  // Update global role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ uuid, data }: { uuid: string; data: UpdateGlobalRoleInput }) => {
      // biome-ignore lint/suspicious/noExplicitAny: Eden API type inference issue
      const response = await api.auth.roles({ uuid }).patch({
        name: data.name,
        description: data.description,
        order: data.order,
        permissions: data.permissions,
      } as any);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update global role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['global-roles'] });
      queryClient.invalidateQueries({ queryKey: ['global-role', variables.uuid] });
      toast.success('Global role updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update global role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update global role');
    },
  });

  // Delete global role mutation
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await api.auth.roles({ uuid }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete global role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-roles'] });
      toast.success('Global role deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete global role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete global role');
    },
  });

  // Add member to role mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ roleUuid, userId }: { roleUuid: string; userId: string }) => {
      const response = await api.auth.roles({ uuid: roleUuid }).members.post({
        userId,
      });

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to add member to role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['global-role-members', variables.roleUuid] });
      queryClient.invalidateQueries({ queryKey: ['global-roles'] });
      toast.success('Member added to role successfully');
    },
    onError: (error) => {
      console.error('Failed to add member to role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member to role');
    },
  });

  // Remove member from role mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ roleUuid, userId }: { roleUuid: string; userId: string | number }) => {
      const response = await api.auth.roles({ uuid: roleUuid }).members({ userId }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to remove member from role';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['global-role-members', variables.roleUuid] });
      queryClient.invalidateQueries({ queryKey: ['global-roles'] });
      toast.success('Member removed from role successfully');
    },
    onError: (error) => {
      console.error('Failed to remove member from role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member from role');
    },
  });

  return {
    // Create
    createGlobalRole: createMutation.mutate,
    createGlobalRoleAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    // Update
    updateGlobalRole: updateMutation.mutate,
    updateGlobalRoleAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    // Delete
    deleteGlobalRole: deleteMutation.mutate,
    deleteGlobalRoleAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Add member
    addMember: addMemberMutation.mutate,
    addMemberAsync: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,

    // Remove member
    removeMember: removeMemberMutation.mutate,
    removeMemberAsync: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
  };
}