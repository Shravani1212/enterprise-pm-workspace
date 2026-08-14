import React, { useState, useEffect } from 'react';
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
  const [firstProjectId, setFirstProjectId] = useState<string>('1');
  const [simulationEnabled, setSimulationEnabled] = useState(false);

  useEffect(() => {
    apiClient.get('/projects').then((res) => {
      if (res.data?.success && res.data?.data?.length > 0) {
        setFirstProjectId(String(res.data.data[0].id));
      }
    }).catch(() => {});
  }, []);

  const activeProjectId = projectId || firstProjectId;

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

  // 5. Fetch Project Members
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
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '380px' }}>
        <RefreshCw className="animate-spin text-primary me-2" style={{ width: '24px', height: '24px' }} />
        <span className="fw-semibold small">Loading Workspace & Executing Filters...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-3">
      {/* View Header Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1">Kanban Workspace</h2>
          <p className="small text-muted mb-0">
            Multi-criteria search, two-way URL sync, and optimistic UI state engine.
          </p>
        </div>

        {/* Simulation Toggle Switch */}
        <div className="card card-glass border-0 px-3 py-2 rounded-3 shadow-xs d-flex flex-row align-items-center gap-2">
          <Zap style={{ width: '16px', height: '16px' }} className={simulationEnabled ? 'text-warning fill-warning' : 'text-muted'} />
          <span className="small fw-semibold text-dark me-2" style={{ fontSize: '0.78rem' }}>1.5s Latency & 15% Error Sim:</span>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input shadow-none cursor-pointer"
              type="checkbox"
              role="switch"
              checked={simulationEnabled}
              onChange={(e) => setSimulationEnabled(e.target.checked)}
            />
          </div>
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
