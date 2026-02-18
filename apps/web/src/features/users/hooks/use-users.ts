import { api } from '#/lib/api';
import type {
  UserCreatePayload,
  UserIndexQuery,
  UserUpdatePayload,
} from '#backend/modules/users/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersListQueryOptions } from '../queries/user-queries';

/**
 * Users Hook
 *
 * Provides methods to fetch, create, update, delete users
 * Uses react-query for caching and state management
 */
export function useUsers(filters?: UserIndexQuery) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST (with pagination)
  // ====================================================================
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...usersListQueryOptions(filters),
  });

  // ====================================================================
  // ➕ CREATE
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (payload: UserCreatePayload) => {
      const response = await api.users.post(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create user';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      toast.success('User created successfully');
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    },
  });

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UserUpdatePayload;
    }) => {
      const response = await api.users({ id: userId }).patch(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update user';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      queryClient.invalidateQueries({
        queryKey: ['user', userId],
      });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.users({ id: userId }).delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete user';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    },
  });

  return {
    // State
    users: usersResponse?.data,
    meta: usersResponse?.meta,
    isLoading,
    error,

    // Actions
    createUser: createMutation.mutate,
    createUserAsync: createMutation.mutateAsync,
    updateUser: updateMutation.mutate,
    updateUserAsync: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutate,
    deleteUserAsync: deleteMutation.mutateAsync,
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