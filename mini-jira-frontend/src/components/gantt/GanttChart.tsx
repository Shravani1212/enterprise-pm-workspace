import React, { useMemo } from 'react';
import { Task as AppTask } from '../../types';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { addDays, startOfWeek } from 'date-fns';
import { Calendar } from 'lucide-react';

interface GanttChartProps {
  tasks: AppTask[];
  onTaskClick?: (task: AppTask) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {

  const ganttTasks: GanttTask[] = useMemo(() => {
    const today = startOfWeek(new Date());

    if (tasks.length === 0) {
      // Gantt component needs at least one task to render correctly without crashing
      return [{
        start: today,
        end: addDays(today, 1),
        name: 'No tasks available',
        id: 'empty',
        type: 'task',
        progress: 0,
        isDisabled: true,
        styles: { progressColor: 'transparent', progressSelectedColor: 'transparent' }
      }];
    }

    return tasks.map(task => {
      const subtasks = task.subtasks || [];
      const completedCount = subtasks.filter(s => s.completed).length;
      const totalSubtasks = subtasks.length || task.subtaskCount || 0;
      const progressPct = totalSubtasks > 0
        ? Math.round((completedCount / totalSubtasks) * 100)
        : task.progressPercentage || 0;

      const taskStart = task.startDate ? new Date(task.startDate) : today;
      const taskEnd = task.endDate ? new Date(task.endDate) : addDays(taskStart, 4);

      return {
        start: taskStart,
        end: taskEnd,
        name: task.title,
        id: String(task.id),
        type: 'task',
        progress: progressPct,
        isDisabled: false,
        styles: { progressColor: '#06b6d4', progressSelectedColor: '#3b82f6' },
        project: String(task.id) // Keep original task ID reference if needed
      };
    });
  }, [tasks]);

  const handleTaskClick = (ganttTask: GanttTask) => {
    if (ganttTask.id === 'empty') return;
    if (onTaskClick) {
      const originalTask = tasks.find(t => String(t.id) === ganttTask.id);
      if (originalTask) {
        onTaskClick(originalTask);
      }
    }
  };

const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  return (
    <div className="d-flex align-items-center border-bottom border-end px-2 bg-light text-muted fw-bold" style={{ height: headerHeight, fontFamily, fontSize, width: rowWidth, minWidth: '240px' }}>
      <div className="flex-grow-1 text-truncate" style={{ paddingRight: '10px' }}>Name</div>
      <div style={{ width: '70px', flexShrink: 0, fontSize: '0.85em' }}>From</div>
      <div style={{ width: '70px', flexShrink: 0, fontSize: '0.85em' }}>To</div>
    </div>
  );
};

const CustomTaskListTable: React.FC<any> = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize }) => {
  return (
    <div style={{ fontFamily, fontSize, width: rowWidth, minWidth: '240px' }} className="border-end">
      {tasks.map((t: GanttTask, i: number) => (
        <div key={t.id} className="d-flex align-items-center border-bottom px-2" style={{ height: rowHeight }}>
          <div className="text-truncate flex-grow-1" style={{ minWidth: 0, paddingRight: '10px', fontSize: '0.9em' }} title={t.name}>
            {t.name}
          </div>
          <div style={{ width: '70px', flexShrink: 0, fontSize: '0.8em', color: '#666' }}>
            {formatDate(t.start)}
          </div>
          <div style={{ width: '70px', flexShrink: 0, fontSize: '0.8em', color: '#666' }}>
            {formatDate(t.end)}
          </div>
        </div>
      ))}
    </div>
  );
};

  return (
    <div className="bg-white border rounded-4 shadow-xs overflow-hidden d-flex flex-column" style={{ height: '100%', minHeight: '600px' }}>
      {/* Top Header Controls Bar */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
        <div className="d-flex align-items-center gap-2">
          <Calendar className="text-primary" style={{ width: '18px', height: '18px' }} />
          <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>Project Timeline & Gantt Chart</h3>
        </div>
      </div>

      {/* Main Gantt Library Component */}
      <div className="flex-grow-1 overflow-auto" style={{ padding: '20px' }}>
        <Gantt
          tasks={ganttTasks}
          viewMode={ViewMode.Day}
          onClick={handleTaskClick}
          columnWidth={60}
          listCellWidth="280px"
          rowHeight={50}
          headerHeight={50}
          TaskListHeader={CustomTaskListHeader}
          TaskListTable={CustomTaskListTable}
        />
      </div>
    </div>
  );
};
