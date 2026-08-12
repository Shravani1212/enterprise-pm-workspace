import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ApiResponse, Task, TaskStatus, Priority, Label, ProjectMember } from '../types';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { useOptimisticKanban } from '../hooks/useOptimisticKanban';
import { useTaskFiltersUrlSync } from '../hooks/useTaskFiltersUrlSync';
import { useDebounce } from '../hooks/useDebounce';
import { ToastContainer } from '../components/Toast';
import { RefreshCw, Zap } from 'lucide-react';

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';
  const [simulationEnabled, setSimulationEnabled] = useState(true);

  // 1. Two-way URL Sync Hook
  const { filters, setFilters, resetFilters } = useTaskFiltersUrlSync();

  // 2. Debounced search keyword (350ms)
  const debouncedSearch = useDebounce(filters.search, 350);

  // 3. Fetch Workflow Statuses
  const { data: statusesData, isLoading: isStatusesLoading } = useQuery({
    queryKey: ['projects', activeProjectId, 'statuses'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaskStatus[]>>(`/projects/${activeProjectId}/statuses`);
      return res.data.data || [];
    },
  });

  // 4. Fetch Priorities
  const { data: prioritiesData } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Priority[]>>('/priorities');
      return res.data.data || [];
    },
  });

  // 5. Fetch Project Members (for Rule 8 filter dropdown)
  const { data: membersData } = useQuery({
    queryKey: ['projects', activeProjectId, 'members'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${activeProjectId}/members`);
      return res.data.data || [];
    },
  });

  // 6. Fetch Project Labels
  const { data: labelsData } = useQuery({
    queryKey: ['projects', activeProjectId, 'labels'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Label[]>>(`/projects/${activeProjectId}/labels`);
      return res.data.data || [];
    },
  });

  // 7. Search & Filtered Tasks API Query
  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: [
      'projects',
      activeProjectId,
      'tasks',
      'search',
      debouncedSearch,
      filters.priorityId,
      filters.statusId,
      filters.assigneeId,
      filters.labelId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.priorityId) params.set('priorityId', filters.priorityId);
      if (filters.statusId) params.set('statusId', filters.statusId);
      if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
      if (filters.labelId) params.set('labelId', filters.labelId);

      const queryString = params.toString();
      const url = queryString
        ? `/projects/${activeProjectId}/tasks/search?${queryString}`
        : `/projects/${activeProjectId}/tasks`;

      const res = await apiClient.get<ApiResponse<Task[]>>(url);
      return res.data.data || [];
    },
  });

  const statuses = statusesData || [];
  const initialTasks = tasksData || [];

  const { tasks, moveTask, toasts, removeToast } = useOptimisticKanban({
    initialTasks,
    statuses,
    enableSimulation: simulationEnabled,
  });

  if (isStatusesLoading || isTasksLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-500 mr-2" />
        <span className="text-sm font-semibold">Loading Workspace & Executing Filters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kanban Workspace</h2>
          <p className="text-xs text-slate-500 font-medium">
            Multi-criteria search, two-way URL sync, and optimistic UI state engine.
          </p>
        </div>

        {/* Simulation Toggle */}
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl border border-slate-200">
          <Zap className={`h-4 w-4 ${simulationEnabled ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold text-slate-700">1.5s Latency & 15% Error Simulation:</span>
          <button
            onClick={() => setSimulationEnabled(!simulationEnabled)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulationEnabled ? 'bg-brand-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Multi-criteria Filter Controls Bar */}
      <TaskFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        priorities={prioritiesData || []}
        statuses={statuses}
        members={membersData || []}
        labels={labelsData || []}
      />

      {/* Kanban Board Container */}
      <KanbanBoard
        statuses={statuses}
        tasks={tasks.length > 0 ? tasks : initialTasks}
        onTaskMove={moveTask}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
