import { api } from '#/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsListQueryOptions } from '../queries/project-queries';
import type {
    ProjectCreatePayload,
    ProjectFilters,
    ProjectUpdatePayload,
} from '../types';

/**
 * Projects Hook
 *
 * Provides methods to fetch, create, update, delete projects
 * Uses react-query for caching and state management
 */
export function useProjects(filters?: ProjectFilters) {
  const queryClient = useQueryClient();

  // ====================================================================
  // 📋 GET LIST
  // ====================================================================
  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...projectsListQueryOptions(filters),
  });

  // ====================================================================
  // ➕ CREATE
  // ====================================================================
  const createMutation = useMutation({
    mutationFn: async (payload: ProjectCreatePayload) => {
      const response = await api.projects.post({
        name: payload.name,
        description: payload.description,
        status: payload.status,
        companyUuid: payload.companyUuid,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to create project';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    },
  });

  // ====================================================================
  // ✏️ UPDATE
  // ====================================================================
  const updateMutation = useMutation({
    mutationFn: async ({
      projectUuid,
      payload,
    }: {
      projectUuid: string;
      payload: ProjectUpdatePayload;
    }) => {
      const response = await api
        .projects({ uuid: projectUuid })
        .put(payload);

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to update project';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (_, { projectUuid }) => {
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', projectUuid],
      });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
    },
  });

  // ====================================================================
  // 🗑️ DELETE
  // ====================================================================
  const deleteMutation = useMutation({
    mutationFn: async (projectUuid: string) => {
      const response = await api
        .projects({ uuid: projectUuid })
        .delete();

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue
            ? String(errorValue.message)
            : 'Failed to delete project';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    },
  });

  return {
    // State
    projects,
    isLoading,
    error,

    // Actions
    createProject: createMutation.mutate,
    createProjectAsync: createMutation.mutateAsync,
    updateProject: updateMutation.mutate,
    updateProjectAsync: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutate,
    deleteProjectAsync: deleteMutation.mutateAsync,
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