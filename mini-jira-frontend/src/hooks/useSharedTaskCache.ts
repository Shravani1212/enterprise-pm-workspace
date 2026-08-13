import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Task } from '../types';

export const useSharedTaskCache = (projectId: string | number) => {
  const queryClient = useQueryClient();
  const queryKey = ['projects', String(projectId), 'tasks'];

  // 1. Invalidate task cache across all views (Kanban, Gantt, Filters)
  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // 2. Direct optimistic query data update (0ms sync)
  const updateTaskInCache = useCallback(
    (updatedTask: Task) => {
      queryClient.setQueryData<Task[]>(queryKey, (oldTasks) => {
        if (!oldTasks) return [updatedTask];
        return oldTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      });
    },
    [queryClient, queryKey]
  );

  // 3. Remove task from cache
  const removeTaskFromCache = useCallback(
    (taskId: number) => {
      queryClient.setQueryData<Task[]>(queryKey, (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.filter((t) => t.id !== taskId);
      });
    },
    [queryClient, queryKey]
  );

  return {
    queryKey,
    invalidateTasks,
    updateTaskInCache,
    removeTaskFromCache,
  };
};
