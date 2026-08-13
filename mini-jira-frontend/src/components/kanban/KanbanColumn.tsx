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
      className="w-80 shrink-0 bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col max-h-full glass-panel"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: status.color }}
          ></span>
          <h3 className="font-bold text-sm text-slate-900">{status.name}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
            {tasks.length}
          </span>
        </div>

        {/* Capacity Warning Indicator (Rule 24) */}
        {status.capacityLimit > 0 && (
          <div
            className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
              isCapacityExceeded
                ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title={
              isCapacityExceeded
                ? `WIP Limit Exceeded! Max capacity is ${status.capacityLimit}`
                : `WIP Limit: ${status.capacityLimit}`
            }
          >
            {isCapacityExceeded && <AlertTriangle className="h-3.5 w-3.5" />}
            <span>
              {tasks.length}/{status.capacityLimit}
            </span>
          </div>
        )}
      </div>

      {/* Task List Drop Zone */}
      <div className="flex-1 overflow-y-auto pr-1">
        <SortableContext
          items={tasks.map((t) => t.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onCardClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs font-medium text-slate-400">
            Drop task here
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <button
        onClick={() => onAddTaskClick?.(status.id)}
        className="mt-3 w-full py-2 border border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/50 text-slate-600 hover:text-brand-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Task</span>
      </button>
    </div>
  );
};
