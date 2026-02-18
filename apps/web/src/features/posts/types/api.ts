// ====================================================================
// 📨 BACKEND TYPES - Backend'den direkt import
// ====================================================================

export type {
  PostShowResponse as Post,
  PostCreatePayload,
  PostUpdatePayload,
} from '#backend/modules/posts/types';

// Frontend için ek filter type
export interface PostFilters {
  search?: string;
  page?: number;
  perPage?: number;
}