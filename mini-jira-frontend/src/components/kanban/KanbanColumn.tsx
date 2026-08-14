import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { AlertTriangle, Plus } from 'lucide-react';

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
  const { setNodeRef } = useDroppable({
    id: status.id.toString(),
  });

  const isCapacityExceeded =
    status.capacityLimit > 0 && tasks.length > status.capacityLimit;

  return (
    <div
      ref={setNodeRef}
      className="card card-glass border-0 shadow-sm rounded-4 p-3 d-flex flex-column max-h-100 flex-shrink-0"
      style={{ width: '320px' }}
    >
      {/* Column Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle d-inline-block"
            style={{ width: '10px', height: '10px', backgroundColor: status.color }}
          ></span>
          <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>{status.name}</h3>
          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>
            {tasks.length}
          </span>
        </div>

        {/* Capacity Warning Indicator */}
        {status.capacityLimit > 0 && (
          <div
            className={`badge d-flex align-items-center gap-1 border px-2 py-1 ${
              isCapacityExceeded
                ? 'badge-subtle-danger animate-pulse'
                : 'bg-light text-secondary border-secondary border-opacity-25'
            }`}
            style={{ fontSize: '0.7rem' }}
            title={
              isCapacityExceeded
                ? `WIP Limit Exceeded! Max capacity is ${status.capacityLimit}`
                : `WIP Limit: ${status.capacityLimit}`
            }
          >
            {isCapacityExceeded && <AlertTriangle style={{ width: '12px', height: '12px' }} />}
            <span>
              {tasks.length}/{status.capacityLimit}
            </span>
          </div>
        )}
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

      {/* Quick Add Button */}
      <button
        onClick={() => onAddTaskClick?.(status.id)}
        className="btn btn-sm btn-outline-primary border-dashed rounded-3 w-100 d-flex align-items-center justify-center gap-1.5 mt-2 fw-semibold"
        style={{ fontSize: '0.8rem' }}
      >
        <Plus style={{ width: '14px', height: '14px' }} />
        <span>Add Task</span>
      </button>
    </div>
  );
};
