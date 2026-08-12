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
      <div className="flex items-center justify-center h-96 text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-500 mr-2" />
        <span className="text-sm font-semibold">Loading Gantt Timeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gantt Timeline View</h2>
        <p className="text-xs text-slate-500 font-medium">
          Visualize project schedule, start/end dates, and subtask execution progress across timelines.
        </p>
      </div>

      {/* Gantt Component */}
      <GanttChart tasks={tasksData || []} />
    </div>
  );
};
