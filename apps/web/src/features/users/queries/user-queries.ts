import { api } from '#/lib/api';
import type {
  UserIndexQuery,
  UserShowResponse,
} from '#backend/modules/users/types';
import { queryOptions } from '@tanstack/react-query';

// Pagination meta type
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

// Paginated response type
export interface PaginatedUsersResponse {
  data: UserShowResponse[];
  meta: PaginationMeta;
}

/**
 * Query Options for Users
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 USERS LIST QUERY (with pagination)
// ====================================================================
export const usersListQueryOptions = (filters?: UserIndexQuery) =>
  queryOptions({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await api.users.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch users');
      }

      return response.data as PaginatedUsersResponse;
    },
  });

// ====================================================================
// 📨 SINGLE USER QUERY
// ====================================================================
export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.users({ id: userId }).get({
        query: {},
      });

      if (response.error) {
        throw new Error('Failed to fetch user');
      }

      return response.data as UserShowResponse;
    },
    enabled: !!userId,
  });