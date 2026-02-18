import { api } from '#/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postsListQueryOptions } from '../queries/post-queries';
import type {
    PostCreatePayload,
    PostFilters,
    PostUpdatePayload,
} from '../types';

/**
 * Posts Hook
 *
 * Provides methods to fetch, create, update, delete posts
 * Uses react-query for caching and state management
 */
export function usePosts(filters?: PostFilters) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST
  // ====================================================================
  const {
    data: posts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...postsListQueryOptions(filters),
  });

  // ====================================================================
  // ➕ CREATE
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (payload: PostCreatePayload) => {
      const response = await api.posts.post({
        title: payload.title,
        content: payload.content,
        published: payload.published,
      });

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create post';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
      });
      toast.success('Post created successfully');
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    },
  });

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({
      postUuid,
      payload,
    }: {
      postUuid: string;
      payload: PostUpdatePayload;
    }) => {
      const response = await api
        .posts({ uuid: postUuid })
        .put(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update post';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { postUuid }) => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['post', postUuid],
      });
      toast.success('Post updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (postUuid: string) => {
      const response = await api
        .posts({ uuid: postUuid })
        .delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete post';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
      });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    },
  });

  return {
    // State
    posts,
    isLoading,
    error,

    // Actions
    createPost: createMutation.mutate,
    createPostAsync: createMutation.mutateAsync,
    updatePost: updateMutation.mutate,
    updatePostAsync: updateMutation.mutateAsync,
    deletePost: deleteMutation.mutate,
    deletePostAsync: deleteMutation.mutateAsync,
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