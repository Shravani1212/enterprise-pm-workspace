import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '../types';
import apiClient from '../services/apiClient';

interface UseOptimisticKanbanProps {
  initialTasks: Task[];
  statuses: TaskStatus[];
  enableSimulation?: boolean; // Controls 1.5s latency & 15% random failure simulation
}

export const useOptimisticKanban = ({
  initialTasks,
  statuses,
  enableSimulation = true,
}: UseOptimisticKanbanProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning'; text: string }>>([]);

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
      // 1. Save state snapshot before optimistic update
      const previousTasks = [...tasks];
      const targetStatus = statuses.find((s) => s.id === targetStatusId);

      if (!targetStatus) return;

      // 2. Update React UI IMMEDIATELY (Optimistic Update)
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status: targetStatus } : task
        )
      );

      try {
        // 3. Simulated Network Latency & Random Failure (Rule 23 Requirement)
        if (enableSimulation) {
          await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5s simulated latency

          const isSimulatedFailure = Math.random() < 0.15; // 15% random failure simulation
          if (isSimulatedFailure) {
            throw new Error('Simulated network error during card movement (15% failure simulation)');
          }
        }

        // 4. Send actual API Request to backend
        await apiClient.patch(`/tasks/${taskId}/status`, {
          statusId: targetStatusId,
        });

        addToast('success', `Task moved to "${targetStatus.name}"`);
      } catch (err: any) {
        // 5. ROLLBACK TO PREVIOUS SNAPSHOT ON FAILURE
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
