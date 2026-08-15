import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (statusId: number) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onTaskClick,
  onAddTaskClick,
}) => {
  const { user } = useAuth();
  const { setNodeRef } = useDroppable({
    id: status.id.toString(),
  });

  const isCapacityExceeded =
    status.capacityLimit > 0 && tasks.length > status.capacityLimit;

  return (
    <div
      ref={setNodeRef}
      className={`card p-3 d-flex flex-column max-h-100 flex-shrink-0 transition-all kanban-column-card ${
        isCapacityExceeded
          ? 'kanban-column-exceeded shadow-md'
          : 'kanban-column-bg'
      }`}
    >
      {/* Column Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle d-inline-block"
            style={{ width: '8px', height: '8px', backgroundColor: status.color }}
          ></span>
          <h3 className="h6 fw-extrabold mb-0 text-dark text-uppercase tracking-wider" style={{ fontSize: '0.82rem', letterSpacing: '0.06em' }}>
            {status.name}
          </h3>
        </div>

        {/* Count / Capacity Pill Badge matching image mock (e.g. 3, 2/4, 1/3, 2) */}
        <span 
          className={`badge rounded-pill px-2.5 py-1 fw-bold border ${
            isCapacityExceeded 
              ? 'bg-danger text-white border-danger animate-pulse' 
              : 'bg-white text-secondary border shadow-xs'
          }`}
          style={{ fontSize: '0.72rem' }}
          title={status.capacityLimit > 0 ? `WIP Limit: ${status.capacityLimit}` : `${tasks.length} tasks`}
        >
          {status.capacityLimit > 0 ? `${tasks.length}/${status.capacityLimit}` : tasks.length}
        </span>
      </div>

      {/* Task List Drop Zone */}
      <div className="flex-grow-1 overflow-auto pe-1">
        <SortableContext
          items={tasks.map((t) => t.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onCardClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="border border-2 border-dashed rounded-3 d-flex align-items-center justify-center text-muted small py-5 my-2">
            Drop task here
          </div>
        )}
      </div>

      {/* Quick Add Button (Only for PM — NOT Lead/Dev/Admin) */}
      {(user?.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER') && onAddTaskClick) && (
        <button
          onClick={() => onAddTaskClick(status.id)}
          className="btn btn-sm btn-outline-primary border-dashed rounded-3 w-100 d-flex align-items-center justify-center gap-1.5 mt-2 fw-semibold"
          style={{ fontSize: '0.8rem' }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          <span>Add Task</span>
        </button>
      )}
    </div>
  );
};
