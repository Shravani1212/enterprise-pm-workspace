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

  const getPriorityBadgeStyle = (code?: string) => {
    switch (code) {
      case 'CRITICAL': return 'badge-subtle-danger';
      case 'HIGH': return 'badge-subtle-warning';
      case 'MEDIUM': return 'badge-subtle-primary';
      default: return 'bg-light text-secondary border';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, cursor: 'grab' }}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(task)}
      className="card card-hover-lift border-0 shadow-sm rounded-3 p-3 mb-3 user-select-none"
    >
      {/* Labels & Tags */}
      {task.labels && task.labels.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}30`, fontSize: '0.65rem' }}
              className="badge border d-flex align-items-center gap-1 text-uppercase rounded-pill px-2 py-1"
            >
              <Tag style={{ width: '10px', height: '10px' }} />
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Task Title */}
      <h4 className="h6 fw-bold text-dark mb-1 text-truncate-2" style={{ fontSize: '0.88rem', lineHeight: '1.3' }}>
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-muted small mb-2 text-truncate-2" style={{ fontSize: '0.78rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      {/* Document/Image Instruction Attachment Badge */}
      {task.attachmentPath && (
        <div className="mb-2 d-flex align-items-center justify-content-between p-2 rounded-2 bg-info bg-opacity-10 border border-info border-opacity-25" style={{ fontSize: '0.75rem' }}>
          <a
            href={`/api/v1/tasks/${task.id}/attachment`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="d-flex align-items-center gap-1.5 text-decoration-none fw-semibold text-info text-truncate"
            title={`View Document Instructions: ${task.attachmentName || 'Attachment'}`}
          >
            {task.attachmentType?.includes('image') ? (
              <ImageIcon style={{ width: '14px', height: '14px' }} />
            ) : (
              <FileText style={{ width: '14px', height: '14px' }} />
            )}
            <span className="text-truncate" style={{ maxWidth: '180px' }}>{task.attachmentName || 'Instructions Document'}</span>
          </a>
          <span className="badge bg-info bg-opacity-25 text-info text-uppercase ms-1" style={{ fontSize: '0.6rem' }}>
            {task.attachmentType?.includes('pdf') ? 'PDF' : task.attachmentType?.includes('image') ? 'IMG' : 'DOC'}
          </span>
        </div>
      )}

      {/* SLA Timer & Escalation Badge */}
      {task.escalationLevel && task.escalationLevel !== 'NONE' ? (
        <div className="mb-2">
          {task.escalationLevel === 'ADMIN_CRITICAL_ESCALATION' && (
            <div className="badge bg-danger text-white w-100 p-2 d-flex align-items-center gap-1 shadow-xs animate-pulse" style={{ fontSize: '0.68rem' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              <span>🚨 18d OVERDUE (ADMIN ESCALATED)</span>
            </div>
          )}
          {task.escalationLevel === 'PM_ESCALATION' && (
            <div className="badge bg-warning text-dark w-100 p-2 d-flex align-items-center gap-1 shadow-xs" style={{ fontSize: '0.68rem' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              <span>⚠️ 7d OVERDUE (PM ESCALATION)</span>
            </div>
          )}
          {task.escalationLevel === 'DEVELOPER_WARNING' && (
            <div className="badge badge-subtle-primary w-100 p-2 d-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              <span>⏱️ SLA Warning Threshold</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2 d-flex align-items-center justify-content-between text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
          <span className="d-flex align-items-center gap-1">
            <Clock style={{ width: '12px', height: '12px' }} />
            <span>Logged: {task.loggedHours || 0}h / {task.estimatedHours || 8}h</span>
          </span>
          <span className="text-secondary fw-bold" style={{ fontSize: '0.68rem' }}>
            {Math.max(0, (task.estimatedHours || 8) - (task.loggedHours || 0))}h rem
          </span>
        </div>
      )}

      {/* Subtask Progress Engine Indicator */}
      {task.subtaskCount > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
            <span className="d-flex align-items-center gap-1">
              <CheckSquare className="text-primary" style={{ width: '12px', height: '12px' }} />
              <span>Subtasks</span>
            </span>
            <span>{task.completedSubtaskCount}/{task.subtaskCount} ({task.progressPercentage}%)</span>
          </div>
          <div className="progress rounded-pill" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-gradient-primary rounded-pill"
              role="progressbar"
              style={{ width: `${task.progressPercentage}%` }}
              aria-valuenow={task.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
        {/* Priority Badge */}
        <span className={`badge text-uppercase ${getPriorityBadgeStyle(task.priority?.code)}`} style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>
          {task.priority?.name || 'MEDIUM'}
        </span>

        {/* Assignee Avatar */}
        <div className="d-flex align-items-center gap-1">
          {task.assignee ? (
            <div
              className="rounded-circle bg-gradient-accent text-white fw-bold d-flex align-items-center justify-center shadow-xs"
              style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}
              title={`${task.assignee.firstName} ${task.assignee.lastName}`}
            >
              {task.assignee.firstName[0]}
            </div>
          ) : (
            <div className="rounded-circle bg-light border text-muted d-flex align-items-center justify-center" style={{ width: '24px', height: '24px' }} title="Unassigned">
              <UserIcon style={{ width: '12px', height: '12px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
