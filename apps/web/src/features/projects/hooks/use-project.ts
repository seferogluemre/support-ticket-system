import { useQuery } from '@tanstack/react-query';
import { projectQueryOptions } from '../queries/project-queries';

/**
 * Single Project Hook
 *
 * Provides methods to fetch a single project
 * Uses react-query for caching and state management
 */
export function useProject(projectUuid: string) {
  // ====================================================================
  // 📨 GET SINGLE PROJECT
  // ====================================================================
  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...projectQueryOptions(projectUuid),
    enabled: !!projectUuid,
  });

  return {
    // State
    project,
    isLoading,
    error,

    // Actions
    refetch,
  };
}