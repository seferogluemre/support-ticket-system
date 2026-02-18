import { useQuery } from '@tanstack/react-query';
import { postQueryOptions } from '../queries/post-queries';

/**
 * Single Post Hook
 *
 * Provides methods to fetch a single post
 * Uses react-query for caching and state management
 */
export function usePost(postUuid: string) {
  // ====================================================================
  // 📨 GET SINGLE POST
  // ====================================================================
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...postQueryOptions(postUuid),
    enabled: !!postUuid,
  });

  return {
    // State
    post,
    isLoading,
    error,

    // Actions
    refetch,
  };
}