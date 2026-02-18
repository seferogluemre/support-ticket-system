import { api } from '#/lib/api';
import { queryOptions } from '@tanstack/react-query';
import type { Project, ProjectFilters } from '../types';

/**
 * Query Options for Projects
 *
 * Tanstack Router loader'da kullanılmak üzere query options
 */

// ====================================================================
// 📋 PROJECTS LIST QUERY
// ====================================================================
export const projectsListQueryOptions = (
  filters?: ProjectFilters,
) =>
  queryOptions({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const response = await api.projects.get({
        query: filters || {},
      });

      if (response.error) {
        throw new Error('Failed to fetch projects');
      }

      return response.data?.data as Project[];
    },
  });

// ====================================================================
// 📨 SINGLE PROJECT QUERY
// ====================================================================
export const projectQueryOptions = (projectUuid: string) =>
  queryOptions({
    queryKey: ['project', projectUuid],
    queryFn: async () => {
      const response = await api
        .projects({ uuid: projectUuid })
        .get();

      if (response.error) {
        throw new Error('Failed to fetch project');
      }

      return response.data as Project;
    },
    enabled: !!projectUuid,
  });