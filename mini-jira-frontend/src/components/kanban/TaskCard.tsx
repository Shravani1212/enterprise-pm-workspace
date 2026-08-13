import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { CheckSquare, Clock, FileText, Image as ImageIcon, Tag, User as UserIcon } from 'lucide-react';

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

      {/* Document/Image Instruction Attachment Badge */}
      {task.attachmentPath && (
        <div className="mb-2.5 flex items-center justify-between text-[11px] bg-sky-50 text-sky-700 border border-sky-200/80 px-2.5 py-1 rounded-lg">
          <a
            href={`/api/v1/tasks/${task.id}/attachment`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:underline font-semibold text-[11px] truncate max-w-[200px]"
            title={`View Document Instructions: ${task.attachmentName || 'Attachment'}`}
          >
            {task.attachmentType?.includes('image') ? (
              <ImageIcon className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            )}
            <span className="truncate">{task.attachmentName || 'Instructions Document'}</span>
          </a>
          <span className="text-[9px] font-bold uppercase bg-sky-200/60 text-sky-800 px-1.5 py-0.5 rounded ml-1 shrink-0">
            {task.attachmentType?.includes('pdf') ? 'PDF' : task.attachmentType?.includes('image') ? 'IMG' : 'DOC'}
          </span>
        </div>
      )}

      {/* SLA Timer & Escalation Badge */}
      {task.escalationLevel && task.escalationLevel !== 'NONE' ? (
        <div className="mb-2.5">
          {task.escalationLevel === 'ADMIN_CRITICAL_ESCALATION' && (
            <div className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm animate-pulse">
              <Clock className="h-3 w-3" />
              <span>🚨 18d OVERDUE (ADMIN ESCALATED)</span>
            </div>
          )}
          {task.escalationLevel === 'PM_ESCALATION' && (
            <div className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <Clock className="h-3 w-3" />
              <span>⚠️ 7d OVERDUE (PM ESCALATION)</span>
            </div>
          )}
          {task.escalationLevel === 'DEVELOPER_WARNING' && (
            <div className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-indigo-500" />
              <span>⏱️ SLA Warning Threshold</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Time Logged: {task.loggedHours || 0}h / {task.estimatedHours || 8}h</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {Math.max(0, (task.estimatedHours || 8) - (task.loggedHours || 0))}h rem
          </span>
        </div>
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
