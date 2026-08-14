import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Subtask } from '../../types';
import { 
  GripVertical,
  ChevronRight, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Edit3,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { formatRelativeTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onCardClick?: (task: Task) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task: initialTask, onCardClick, onTaskUpdated }) => {
  const { user } = useAuth();
  const [task, setTask] = useState<Task>(initialTask);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskLoadingId, setSubtaskLoadingId] = useState<number | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

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

  // Dynamic Badge Color matching Image Mock (LOW=Green, MEDIUM=Orange, HIGH=Red)
  const getPriorityBadgeStyle = (code?: string) => {
    switch (code) {
      case 'CRITICAL':
      case 'HIGH':
        return {
          bg: '#fee2e2',
          color: '#dc2626',
          border: '#fca5a5'
        };
      case 'MEDIUM':
        return {
          bg: '#fef3c7',
          color: '#d97706',
          border: '#fde68a'
        };
      case 'LOW':
      default:
        return {
          bg: '#dcfce7',
          color: '#16a34a',
          border: '#bbf7d0'
        };
    }
  };

  const priorityStyle = getPriorityBadgeStyle(task.priority?.code);

  // Interactive Live Subtask Toggle Handler
  const handleToggleSubtask = async (e: React.MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    try {
      setSubtaskLoadingId(subtaskId);
      const res = await apiClient.patch(`/subtasks/${subtaskId}/toggle`);
      if (res.data?.success && res.data?.data) {
        const updated = res.data.data;
        setTask(updated);
        onTaskUpdated?.(updated);
      }
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    } finally {
      setSubtaskLoadingId(null);
    }
  };

  // Create Subtask Handler
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newSubtaskTitle.trim()) return;

    try {
      setAddingSubtask(true);
      const res = await apiClient.post(`/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle.trim()
      });
      if (res.data?.success) {
        const taskRes = await apiClient.get(`/tasks/${task.id}`);
        if (taskRes.data?.success && taskRes.data?.data) {
          setTask(taskRes.data.data);
          onTaskUpdated?.(taskRes.data.data);
        }
        setNewSubtaskTitle('');
      }
    } catch (err) {
      console.error('Failed to add subtask', err);
    } finally {
      setAddingSubtask(false);
    }
  };

  // Delete Subtask Handler
  const handleDeleteSubtask = async (e: React.MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    try {
      const res = await apiClient.delete(`/subtasks/${subtaskId}`);
      if (res.data?.success && res.data?.data) {
        setTask(res.data.data);
        onTaskUpdated?.(res.data.data);
      }
    } catch (err) {
      console.error('Failed to delete subtask', err);
    }
  };

  const subtasksList = task.subtasks || [];
  const completedCount = subtasksList.filter(s => s.completed).length;
  const totalSubtasks = subtasksList.length || task.subtaskCount || 0;
  const calculatedProgress = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : task.progressPercentage || 0;

  const timeAgoStr = formatRelativeTime(task.updatedAt || task.createdAt);

  const canManageSubtasks = user?.roles?.some(r => 
    r === 'ADMIN' || r === 'ROLE_ADMIN' || 
    r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER' || 
    r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD'
  );

  return (
    <div
      ref={setNodeRef}
      style={{ ...style }}
      className={`card border-0 shadow-sm rounded-4 p-3 mb-3 user-select-none transition-all card-hover-lift ${
        isExpanded ? 'ring-2 ring-primary shadow-md bg-white' : 'bg-white'
      }`}
    >
      {/* Top Header Row: Drag Handle + Title + Priority Pill Badge */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
          {/* Drag Grip Handle matching image mock */}
          <div
            {...attributes}
            {...listeners}
            className="text-muted opacity-40 cursor-grab hover-opacity-100 p-0.5"
            title="Drag to move"
          >
            <GripVertical style={{ width: '16px', height: '16px' }} />
          </div>

          {/* Task Heading */}
          <h4
            onClick={() => onCardClick?.(task)}
            className="h6 fw-bold text-dark mb-0 cursor-pointer hover-text-primary text-truncate flex-grow-1"
            style={{ fontSize: '0.9rem', lineHeight: '1.3' }}
          >
            {task.title}
          </h4>
        </div>

        {/* Priority Badge Pill matching Image Mock (LOW, MEDIUM, HIGH) */}
        <span
          className="badge rounded-pill text-uppercase fw-extrabold px-2.5 py-1"
          style={{
            fontSize: '0.62rem',
            backgroundColor: priorityStyle.bg,
            color: priorityStyle.color,
            border: `1px solid ${priorityStyle.border}`,
            letterSpacing: '0.05em'
          }}
        >
          {task.priority?.name || 'MEDIUM'}
        </span>
      </div>

      {/* SLA Alert Badge if escalated */}
      {task.escalationLevel && task.escalationLevel !== 'NONE' && (
        <div className="mb-2">
          {task.escalationLevel === 'ADMIN_CRITICAL_ESCALATION' && (
            <div className="badge bg-danger text-white w-100 p-1.5 d-flex align-items-center gap-1 shadow-xs" style={{ fontSize: '0.65rem' }}>
              <Clock style={{ width: '11px', height: '11px' }} />
              <span>🚨 ADMIN ESCALATED</span>
            </div>
          )}
          {task.escalationLevel === 'PM_ESCALATION' && (
            <div className="badge bg-warning text-dark w-100 p-1.5 d-flex align-items-center gap-1 shadow-xs" style={{ fontSize: '0.65rem' }}>
              <Clock style={{ width: '11px', height: '11px' }} />
              <span>⚠️ PM OVERDUE</span>
            </div>
          )}
        </div>
      )}

      {/* Subtasks Progress Tracker Row (Only shown if totalSubtasks > 0) */}
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="d-flex justify-content-between align-items-center cursor-pointer hover-text-primary text-muted fw-medium mb-1.5" 
            style={{ fontSize: '0.76rem' }}
          >
            <span className="d-flex align-items-center gap-1">
              {isExpanded ? (
                <ChevronDown style={{ width: '14px', height: '14px' }} className="text-secondary" />
              ) : (
                <ChevronRight style={{ width: '14px', height: '14px' }} className="text-secondary" />
              )}
              <span>{completedCount} of {totalSubtasks} subtasks done</span>
            </span>
            <span className="fw-semibold text-secondary" style={{ fontSize: '0.74rem' }}>
              {calculatedProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="progress rounded-pill bg-light" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-gradient-primary rounded-pill transition-all"
              role="progressbar"
              style={{ width: `${calculatedProgress}%` }}
              aria-valuenow={calculatedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
      )}

      {/* Expand/Collapse Toggle hint if no subtasks exist yet */}
      {totalSubtasks === 0 && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="d-flex align-items-center gap-1 cursor-pointer text-muted small mb-2 hover-text-primary"
          style={{ fontSize: '0.72rem' }}
        >
          {isExpanded ? (
            <ChevronDown style={{ width: '13px', height: '13px' }} />
          ) : (
            <ChevronRight style={{ width: '13px', height: '13px' }} />
          )}
          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
        </div>
      )}

      {/* Expanded Subtask List & Complete Details (Only Shown When Expanded) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-top animate-fade-in" onClick={(e) => e.stopPropagation()}>
          
          {/* Description (Visible Upon Expansion) */}
          {task.description && (
            <div className="mb-3 p-2.5 rounded-3 bg-light border">
              <span className="text-muted fw-bold d-block small mb-1" style={{ fontSize: '0.7rem' }}>Description:</span>
              <p className="text-dark mb-0 small" style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Interactive Subtasks List */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-dark text-uppercase small" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Subtasks Breakdown ({completedCount}/{totalSubtasks})
              </span>
            </div>

            <div className="d-flex flex-column gap-1 mb-2">
              {subtasksList.map((st: Subtask) => (
                <div 
                  key={st.id} 
                  onClick={(e) => handleToggleSubtask(e, st.id)}
                  className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light hover-bg-white border cursor-pointer transition-all"
                  style={{ fontSize: '0.78rem' }}
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                    {st.completed ? (
                      <CheckCircle2 style={{ width: '15px', height: '15px' }} className="text-primary fill-primary text-white flex-shrink-0" />
                    ) : (
                      <Circle style={{ width: '15px', height: '15px' }} className="text-muted flex-shrink-0" />
                    )}
                    <span className={`text-dark ${st.completed ? 'text-decoration-line-through text-muted' : 'fw-semibold'}`}>
                      {st.title}
                    </span>
                  </div>

                  {canManageSubtasks && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubtask(e, st.id)}
                      className="btn btn-sm btn-link text-danger p-0 border-0 ms-2 opacity-60 hover-opacity-100"
                      title="Delete Subtask"
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  )}
                </div>
              ))}

              {subtasksList.length === 0 && (
                <div className="text-muted small italic py-1" style={{ fontSize: '0.75rem' }}>
                  No subtasks added yet.
                </div>
              )}
            </div>

            {/* Quick Add Subtask Form (Restricted to ADMIN, PM, PROJECT_LEAD) */}
            {canManageSubtasks && (
              <form onSubmit={handleAddSubtask} className="input-group input-group-sm">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add subtask title..."
                  className="form-control bg-light border-end-0 shadow-none text-xs"
                />
                <button
                  type="submit"
                  disabled={addingSubtask || !newSubtaskTitle.trim()}
                  className="btn btn-primary bg-gradient-primary border-start-0 px-3 fw-semibold text-xs"
                >
                  <Plus style={{ width: '13px', height: '13px' }} />
                </button>
              </form>
            )}
          </div>

          {/* Document Attachment link if present */}
          {task.attachmentPath && (
            <div className="mb-3 d-flex align-items-center justify-content-between p-2 rounded-2 bg-info bg-opacity-10 border border-info border-opacity-25" style={{ fontSize: '0.75rem' }}>
              <a
                href={`/api/v1/tasks/${task.id}/attachment`}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center gap-1.5 text-decoration-none fw-semibold text-info text-truncate"
              >
                {task.attachmentType?.includes('image') ? (
                  <ImageIcon style={{ width: '14px', height: '14px' }} />
                ) : (
                  <FileText style={{ width: '14px', height: '14px' }} />
                )}
                <span className="text-truncate">{task.attachmentName || 'Attachment Document'}</span>
              </a>
            </div>
          )}

          {/* Action Footer */}
          <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => onCardClick?.(task)}
              className="btn btn-sm btn-outline-primary border-dashed rounded-3 px-3 py-1 fw-semibold text-xs d-flex align-items-center gap-1.5"
            >
              <Edit3 style={{ width: '12px', height: '12px' }} />
              <span>Full Edit Task Modal</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Footer matching Image 1 (Assignee Avatar + Full Name on left, Clock + Timestamp on right) */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
        {/* Assignee Avatar Circle + Name matching Image 1 (e.g. SL Sara Lin, JC John Carter) */}
        <div className="d-flex align-items-center gap-1.5">
          {task.assignee ? (
            <>
              <div
                className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-center shadow-xs"
                style={{ width: '22px', height: '22px', fontSize: '0.62rem' }}
              >
                {task.assignee.firstName[0]}
                {task.assignee.lastName ? task.assignee.lastName[0] : ''}
              </div>
              <span className="text-secondary fw-semibold" style={{ fontSize: '0.74rem' }}>
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            </>
          ) : (
            <span className="text-muted italic" style={{ fontSize: '0.74rem' }}>
              Unassigned
            </span>
          )}
        </div>

        {/* Timestamp with Clock Icon matching Image 1 (e.g. 15h ago, 1m ago, 10h ago, just now) */}
        <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.72rem' }}>
          <Clock style={{ width: '12px', height: '12px' }} />
          <span>{timeAgoStr}</span>
        </div>
      </div>
    </div>
  );
};
