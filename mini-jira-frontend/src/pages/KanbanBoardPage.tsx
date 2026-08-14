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
import { RefreshCw } from 'lucide-react';

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams();
  const [firstProjectId, setFirstProjectId] = useState<string>('1');

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

  const DEFAULT_4_STATUSES: TaskStatus[] = [
    { id: 1, name: 'Backlog', code: 'BACKLOG', displayOrder: 1, color: '#94a3b8', capacityLimit: 0, active: true },
    { id: 2, name: 'To Do', code: 'TODO', displayOrder: 2, color: '#3b82f6', capacityLimit: 0, active: true },
    { id: 3, name: 'In Progress', code: 'IN_PROGRESS', displayOrder: 3, color: '#f59e0b', capacityLimit: 3, active: true },
    { id: 4, name: 'Done', code: 'DONE', displayOrder: 4, color: '#10b981', capacityLimit: 0, active: true },
  ];

  const rawStatuses = (statusesData && statusesData.length > 0) ? statusesData : DEFAULT_4_STATUSES;
  const hasBacklog = rawStatuses.some(s => s.code === 'BACKLOG');
  const statuses = hasBacklog
    ? [...rawStatuses].sort((a, b) => a.displayOrder - b.displayOrder)
    : [DEFAULT_4_STATUSES[0], ...rawStatuses].sort((a, b) => a.displayOrder - b.displayOrder);

  const initialTasks = tasksData || [];

  const { tasks, moveTask, toasts, removeToast } = useOptimisticKanban({
    initialTasks,
    statuses,
    enableSimulation: false,
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
      {/* View Header Bar with Dual-View Toggle */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1">
            <h2 className="h4 fw-bold text-dark mb-0">Kanban Workspace</h2>
            
            {/* Dual-View Navigation Tab Bar */}
            <div className="btn-group btn-group-sm bg-white p-1 rounded-3 border shadow-xs">
              <button
                type="button"
                className="btn btn-sm btn-primary bg-gradient-primary fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Board View
              </button>
              <button
                type="button"
                onClick={() => {
                  const query = window.location.search;
                  window.location.href = `/projects/${activeProjectId}/gantt${query}`;
                }}
                className="btn btn-sm btn-light text-muted hover-text-dark fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Gantt Timeline View
              </button>
            </div>
          </div>
          <p className="small text-muted mb-0">
            Multi-criteria search, two-way URL sync, expandable cards, and optimistic UI state engine.
          </p>
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
