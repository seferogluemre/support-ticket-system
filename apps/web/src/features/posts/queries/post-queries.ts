import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { Post, PostFilters } from '../types';

/**
 * Query Options for Posts
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 POSTS LIST QUERY
// ====================================================================
export const postsListQueryOptions = (
  filters?: PostFilters,
) =>
  queryOptions({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const response = await api.posts.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch posts');
      }

      return response.data?.data as Post[];
    },
  });

// ====================================================================
// 📨 SINGLE POST QUERY
// ====================================================================
export const postQueryOptions = (postUuid: string) =>
  queryOptions({
    queryKey: ['post', postUuid],
    queryFn: async () => {
      const response = await api
        .posts({ uuid: postUuid })
        .get();

      if (response.error) {
        throw new Error('Failed to fetch post');
      }

      return response.data as Post;
    },
    enabled: !!postUuid,
  });