import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ApiResponse, Task, Priority, TaskStatus, ProjectMember, Label } from '../types';
import { GanttChart } from '../components/gantt/GanttChart';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { useTaskFiltersUrlSync } from '../hooks/useTaskFiltersUrlSync';
import { useDebounce } from '../hooks/useDebounce';
import { RefreshCw } from 'lucide-react';

export const GanttPage: React.FC = () => {
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Two-way URL Sync Hook
  const { filters, setFilters, resetFilters } = useTaskFiltersUrlSync();

  // 2. Debounced search keyword
  const debouncedSearch = useDebounce(filters.search, 350);

  // 3. Fetch Priorities & Statuses & Members for Filter Bar
  const { data: statusesData, isLoading: isStatusesLoading } = useQuery({
    queryKey: ['projects', activeProjectId, 'statuses'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaskStatus[]>>(`/projects/${activeProjectId}/statuses`);
      return res.data.data || [];
    },
  });

  const { data: prioritiesData } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Priority[]>>('/priorities');
      return res.data.data || [];
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ['projects', activeProjectId, 'members'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${activeProjectId}/members`);
      return res.data.data || [];
    },
  });

  const { data: labelsData } = useQuery({
    queryKey: ['projects', activeProjectId, 'labels'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Label[]>>(`/projects/${activeProjectId}/labels`);
      return res.data.data || [];
    },
  });

  // 4. Fetch Search & Filtered Tasks Query with keepPreviousData
  const { data: tasksData, isFetching: isTasksFetching } = useQuery({
    queryKey: [
      'projects',
      activeProjectId,
      'tasks',
      'gantt',
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
    placeholderData: keepPreviousData,
  });

  if (isStatusesLoading && !statusesData) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '380px' }}>
        <RefreshCw className="animate-spin text-primary me-2" style={{ width: '24px', height: '24px' }} />
        <span className="fw-semibold small">Loading Gantt Timeline...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-3">
      {/* View Header with Dual-View Navigation Toggle */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1">
            <h2 className="h4 fw-bold text-dark mb-0">Gantt Timeline View</h2>

            {/* Dual-View Navigation Tab Bar */}
            <div className="btn-group btn-group-sm bg-white p-1 rounded-3 border shadow-xs">
              <button
                type="button"
                onClick={() => {
                  navigate(`/projects/${activeProjectId}/board${location.search}`);
                }}
                className="btn btn-sm btn-light text-muted hover-text-dark fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Board View
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary bg-gradient-primary fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Gantt Timeline View
              </button>
            </div>
          </div>
          <p className="small text-muted mb-0">
            Visualize project schedule, start/end dates, and subtask execution progress with unified filtering state.
          </p>
        </div>
      </div>

      {/* Multi-criteria Task Filter Bar */}
      <TaskFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        priorities={prioritiesData || []}
        statuses={statusesData || []}
        members={membersData || []}
        labels={labelsData || []}
      />

      {/* Gantt Chart Component */}
      <GanttChart tasks={tasksData || []} />
    </div>
  );
};
