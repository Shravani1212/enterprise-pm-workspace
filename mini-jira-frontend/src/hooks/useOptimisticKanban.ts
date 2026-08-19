import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import apiClient from '../services/apiClient';

interface UseOptimisticKanbanProps {
  initialTasks: Task[];
  statuses: TaskStatus[];
  enableSimulation?: boolean;
}

export const useOptimisticKanban = ({
  initialTasks,
  statuses,
  enableSimulation = false,
}: UseOptimisticKanbanProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning'; text: string }>>([]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const addToast = (type: 'success' | 'error' | 'warning', text: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const moveTask = useCallback(
    async (taskId: number, targetStatusId: number) => {
      // save prev tasks
      const previousTasks = [...tasks];
      const targetStatus = statuses.find((s) => s.id === targetStatusId);

      if (!targetStatus) return;

      // Update React UI IMMEDIATELY 
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status: targetStatus } : task
        )
      );

      try {

        if (enableSimulation) {
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const isSimulatedFailure = Math.random() < 0.15;
          if (isSimulatedFailure) {
            throw new Error('Simulated network error during card movement (15% failure simulation)');
          }
        }

        await apiClient.patch(`/tasks/${taskId}/status`, {
          statusId: targetStatusId,
        });

        addToast('success', `Task moved to "${targetStatus.name}"`);
      } catch (err: any) {

        setTasks(previousTasks);
        const errMsg = err.message || 'Failed to update task status on server';
        addToast('error', `Rollback: ${errMsg}`);
      }
    },
    [tasks, statuses, enableSimulation]
  );

  return {
    tasks,
    setTasks,
    moveTask,
    toasts,
    removeToast,
  };
};
