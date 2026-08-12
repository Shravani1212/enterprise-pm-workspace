import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { CheckSquare, Clock, Tag, User as UserIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onCardClick?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onCardClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getPriorityBadgeStyle = (code: string) => {
    switch (code) {
      case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(task)}
      className="glass-card p-4 rounded-xl cursor-grab active:cursor-grabbing border border-slate-200/80 mb-3 group hover:border-brand-500/50 transition-all select-none"
    >
      {/* Labels & Tags */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.labels.map((label) => (
            <span
              key={label.id}
              style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}30` }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider"
            >
              <Tag className="h-2.5 w-2.5" />
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Task Title */}
      <h4 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-brand-600 transition-colors mb-1.5">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Engine Indicator */}
      {task.subtaskCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3 text-brand-500" />
              <span>Subtasks</span>
            </span>
            <span>{task.completedSubtaskCount}/{task.subtaskCount} ({task.progressPercentage}%)</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-300"
              style={{ width: `${task.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        {/* Priority Badge */}
        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border ${getPriorityBadgeStyle(task.priority?.code)}`}>
          {task.priority?.name || 'MEDIUM'}
        </span>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div
              className="h-6 w-6 rounded-full bg-gradient-accent text-white font-bold flex items-center justify-center text-[10px] shadow-sm"
              title={`${task.assignee.firstName} ${task.assignee.lastName}`}
            >
              {task.assignee.firstName[0]}
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center" title="Unassigned">
              <UserIcon className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
