import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ApiResponse, Task } from '../types';
import { GanttChart } from '../components/gantt/GanttChart';
import { RefreshCw } from 'lucide-react';

export const GanttPage: React.FC = () => {
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['projects', activeProjectId, 'tasks'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Task[]>>(`/projects/${activeProjectId}/tasks`);
      return res.data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '380px' }}>
        <RefreshCw className="animate-spin text-primary me-2" style={{ width: '24px', height: '24px' }} />
        <span className="fw-semibold small">Loading Gantt Timeline...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-4">
      {/* View Header */}
      <div>
        <h2 className="h4 fw-bold text-dark mb-1">Gantt Timeline View</h2>
        <p className="small text-muted mb-0">
          Visualize project schedule, start/end dates, and subtask execution progress across timelines.
        </p>
      </div>

      {/* Gantt Component */}
      <GanttChart tasks={tasksData || []} />
    </div>
  );
};
