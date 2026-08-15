import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
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
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../../utils/alertUtils';
import { sendSubtaskAssignmentEmail } from '../../services/emailService';

interface TaskCardProps {
  task: Task;
  onCardClick?: (task: Task) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task: initialTask, onCardClick, onTaskUpdated }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN') ?? false;
  const isPm = user?.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER') ?? false;
  const isLead = user?.roles?.some(r => r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD') ?? false;
  const isDev = user?.roles?.some(r => r === 'DEVELOPER' || r === 'ROLE_DEVELOPER') ?? false;
  
  const isAssignedToMe = initialTask.assignee?.username && user?.username && initialTask.assignee.username.toLowerCase() === user.username.toLowerCase();
  const canDrag = !isAdmin && (isPm || isLead || (isDev && isAssignedToMe));
  const [task, setTask] = useState<Task>(initialTask);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskLoadingId, setSubtaskLoadingId] = useState<number | null>(null);

  // States for subtask developer assignment
  const [members, setMembers] = useState<any[]>([]);
  const [assigneeDevId, setAssigneeDevId] = useState<string>('');
  const [subtaskEstHours, setSubtaskEstHours] = useState<number>(0);
  const [subtaskDueDate, setSubtaskDueDate] = useState<string>('');

  // Sync state if prop changes
  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Fetch project members to assign developers to subtasks
  useEffect(() => {
    if (isExpanded && task.projectId) {
      console.log(`[TaskCard] Fetching members for project ID ${task.projectId} (Task: ${task.title})`);
      apiClient.get(`/projects/${task.projectId}/members`).then(res => {
        if (res.data?.success && res.data?.data) {
          console.log(`[TaskCard] Fetched ${res.data.data.length} members:`, res.data.data);
          setMembers(res.data.data);
        }
      }).catch(err => {
        console.error(`[TaskCard] Failed to fetch project members`, err);
      });
    }
  }, [isExpanded, task.projectId]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString(), disabled: !canDrag });

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
        queryClient.setQueriesData({ queryKey: ['projects', String(task.projectId), 'tasks'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((t: Task) => (t.id === updated.id ? updated : t));
        });
      }
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    } finally {
      setSubtaskLoadingId(null);
    }
  };

  // Create Subtask Handler — append locally to avoid double-refresh bug
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = newSubtaskTitle.trim();
    if (!title) return;

    let prefix = '';
    if (assigneeDevId) {
      const selectedMember = members.find((m) => String(m.user?.id) === assigneeDevId);
      if (selectedMember) {
        prefix += `[@${selectedMember.user.username}] `;
      }
    }
    if (subtaskEstHours > 0) {
      prefix += `[hrs:${subtaskEstHours}] `;
    }
    if (subtaskDueDate) {
      prefix += `[due:${subtaskDueDate}] `;
    }
    const finalTitle = `${prefix}${title}`;

    try {
      setAddingSubtask(true);
      const res = await apiClient.post(`/tasks/${task.id}/subtasks`, { title: finalTitle });
      if (res.data?.success && res.data?.data) {
        // Backend may return the new subtask OR the full updated task
        const returned = res.data.data;
        let updatedTask: Task;
        if (Array.isArray(returned?.subtasks)) {
          // Full task returned
          updatedTask = returned as Task;
        } else {
          // Only the new subtask returned — append it locally
          const newSubtask = returned;
          updatedTask = {
            ...task,
            subtasks: [...(task.subtasks || []), newSubtask],
            subtaskCount: (task.subtaskCount || 0) + 1,
          };
        }
        setTask(updatedTask);
        onTaskUpdated?.(updatedTask);
        queryClient.setQueriesData({ queryKey: ['projects', String(task.projectId), 'tasks'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((t: Task) => (t.id === updatedTask.id ? updatedTask : t));
        });
        if (assigneeDevId) {
          const assignedUser = members.find((m) => String(m.user?.id) === assigneeDevId)?.user;
          if (assignedUser && assignedUser.email) {
            sendSubtaskAssignmentEmail(
              assignedUser.email,
              assignedUser.username || assignedUser.firstName,
              task.title,
              title,
              subtaskDueDate,
              subtaskEstHours
            );
          }
        }

        setNewSubtaskTitle('');
        setAssigneeDevId('');
        setSubtaskEstHours(0);
        setSubtaskDueDate('');
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
        queryClient.setQueriesData({ queryKey: ['projects', String(task.projectId), 'tasks'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((t: Task) => (t.id === res.data.data.id ? res.data.data : t));
        });
      }
    } catch (err) {
      console.error('Failed to delete subtask', err);
    }
  };

  // Attachment Handlers for Subtasks
  const handleDownloadAttachment = async (subtaskId: number, filename: string) => {
    try {
      const res = await apiClient.get(`/subtasks/${subtaskId}/attachment`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download subtask attachment', err);
      showErrorAlert('Download Failed', 'Unable to download subtask attachment.');
    }
  };

  const handleUploadAttachment = async (subtaskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post(`/subtasks/${subtaskId}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data?.success && res.data?.data) {
        const updatedSubtask = res.data.data;
        const updatedSubtasks = (task.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, ...updatedSubtask } : s
        );
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        setTask(updatedTask);
        onTaskUpdated?.(updatedTask);
        showSuccessAlert('Uploaded', 'Subtask attachment uploaded successfully.');
      }
    } catch (err) {
      console.error('Failed to upload subtask attachment', err);
      showErrorAlert('Upload Failed', 'Unable to upload subtask attachment.');
    }
  };

  const handleDeleteAttachment = async (subtaskId: number) => {
    const confirmed = await showConfirmAlert(
      'Delete Attachment',
      'Are you sure you want to delete this subtask attachment?',
      'Yes, delete'
    );
    if (!confirmed) return;

    try {
      const res = await apiClient.delete(`/subtasks/${subtaskId}/attachment`);
      if (res.data?.success && res.data?.data) {
        const updatedSubtask = res.data.data;
        const updatedSubtasks = (task.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, ...updatedSubtask } : s
        );
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        setTask(updatedTask);
        onTaskUpdated?.(updatedTask);
        showSuccessAlert('Deleted', 'Subtask attachment deleted successfully.');
      }
    } catch (err) {
      console.error('Failed to delete subtask attachment', err);
      showErrorAlert('Delete Failed', 'Unable to delete subtask attachment.');
    }
  };

  const subtasksList = task.subtasks || [];
  const completedCount = subtasksList.filter(s => s.completed).length;
  const totalSubtasks = subtasksList.length || task.subtaskCount || 0;
  const calculatedProgress = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : task.progressPercentage || 0;

  const timeAgoStr = formatRelativeTime(task.updatedAt || task.createdAt);

  // ── Role Hierarchy in TaskCard ─────────────────────────────────────────
  // ADMIN         : read-only view — no toggles, no add, no delete, no edit
  // PROJECT_MANAGER: full task management (edit, add/delete subtasks, assign)
  // PROJECT_LEAD  : manage subtasks + assign developers
  // DEVELOPER     : toggle own subtask completion; no add/delete

  // Who can add/delete subtasks: Project Manager + Project Lead
  const canManageSubtasks = isPm || isLead || isAdmin;
  // Who can toggle subtask completion: PM + Lead + Developer + Admin
  const canToggleSubtask  = isPm || isLead || isDev || isAdmin;
  // Who can open the full edit modal: PM only (and Admin is read-only)
  const canEditTask = isPm;

  const accentColor = priorityStyle.color || '#6366f1';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${accentColor}`,
      }}
      className={`card rounded-4 p-3 mb-3 user-select-none transition-all task-card-elevated ${
        isExpanded ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top Header Row: Drag Handle + Title + Priority Pill Badge */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
          {/* Drag Grip Handle — hidden if user cannot drag */}
          {canDrag && (
            <div
              {...attributes}
              {...listeners}
              className="text-muted opacity-40 cursor-grab hover-opacity-100 p-0.5"
              title="Drag to move"
            >
              <GripVertical style={{ width: '16px', height: '16px' }} />
            </div>
          )}

          {/* Task Heading */}
          <h4
            onClick={() => canEditTask && onCardClick?.(task)}
            className={`h6 fw-bold text-dark mb-0 text-truncate flex-grow-1 ${canEditTask ? 'cursor-pointer hover-text-primary' : 'cursor-default'}`}
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

      {/* SLA Alert Badge if escalated or overdue */}
      {(() => {
        const getDaysPending = () => {
          if (task.status?.code === 'DONE') return 0;
          const targetDateStr = task.endDate || task.dueDate;
          if (!targetDateStr) return 0;
          const targetDate = new Date(targetDateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          targetDate.setHours(0, 0, 0, 0);
          if (today > targetDate) {
            const diffTime = Math.abs(today.getTime() - targetDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
          return 0;
        };
        const daysPending = getDaysPending();

        return (
          <div className="mb-2 d-flex flex-column gap-1">
            {daysPending > 0 && (
              <div className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 w-100 p-1.5 d-flex align-items-center justify-content-center gap-1 shadow-xs" style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>
                <Clock style={{ width: '11px', height: '11px' }} />
                <span>⚠️ PENDING FOR {daysPending} DAY{daysPending > 1 ? 'S' : ''}</span>
              </div>
            )}
            {task.escalationLevel && task.escalationLevel !== 'NONE' && (
              <>
                {task.escalationLevel === 'ADMIN_CRITICAL_ESCALATION' && (
                  <div className="badge bg-danger text-white w-100 p-1.5 d-flex align-items-center justify-content-center gap-1 shadow-xs" style={{ fontSize: '0.65rem' }}>
                    <Clock style={{ width: '11px', height: '11px' }} />
                    <span>🚨 ADMIN ESCALATED</span>
                  </div>
                )}
                {task.escalationLevel === 'PM_ESCALATION' && (
                  <div className="badge bg-warning text-dark w-100 p-1.5 d-flex align-items-center justify-content-center gap-1 shadow-xs" style={{ fontSize: '0.65rem' }}>
                    <Clock style={{ width: '11px', height: '11px' }} />
                    <span>⚠️ PM OVERDUE</span>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

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

      {/* Expanded Subtask List & Complete Details (Only Shown When Expanded in Modal) */}
      {isExpanded && createPortal(
        <div 
          className="modal fade show d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
              
              {/* Modal Header */}
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3 d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1.05rem' }}>
                    {task.title}
                  </h5>
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span className="badge badge-subtle-primary rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                      Task ID: #{task.id}
                    </span>
                    <span className="badge bg-light text-primary border rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                      Status: {task.status?.name}
                    </span>
                    <span className="badge bg-light text-warning border rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                      Priority: {task.priority?.name}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsExpanded(false)} 
                  className="btn-close btn-close-white shadow-none animate-scale"
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {/* Description */}
                {task.description && (
                  <div className="mb-4 p-3 rounded-3 bg-light border">
                    <span className="text-muted fw-bold d-block small mb-1.5 text-uppercase tracking-wider" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>Description</span>
                    <p className="text-dark mb-0 small" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Subtasks Breakdown */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <span className="fw-bold text-dark text-uppercase small" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                      Subtasks Breakdown ({completedCount}/{totalSubtasks})
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {subtasksList.map((st: Subtask) => {
                      const parseSubtaskTitle = (title: string) => {
                        let username = '';
                        let hours = '';
                        let dueDate = '';
                        let cleanTitle = title;

                        const userMatch = cleanTitle.match(/^\[@([^\]]+)\]/);
                        if (userMatch) {
                          username = userMatch[1];
                          cleanTitle = cleanTitle.replace(/^\[@[^\]]+\]\s*/, '');
                        }

                        const hrsMatch = cleanTitle.match(/^\[hrs:([^\]]+)\]/);
                        if (hrsMatch) {
                          hours = hrsMatch[1];
                          cleanTitle = cleanTitle.replace(/^\[hrs:[^\]]+\]\s*/, '');
                        }

                        const dueMatch = cleanTitle.match(/^\[due:([^\]]+)\]/);
                        if (dueMatch) {
                          dueDate = dueMatch[1];
                          cleanTitle = cleanTitle.replace(/^\[due:[^\]]+\]\s*/, '');
                        }

                        return { username, hours, dueDate, title: cleanTitle };
                      };

                      const parsed = parseSubtaskTitle(st.title);
                      const isAssignedToCurrentUser = parsed.username && user?.username && parsed.username.toLowerCase() === user.username.toLowerCase();
                      const canUserToggleThisSubtask = isPm || isAdmin || isLead || (isDev && isAssignedToCurrentUser);

                      return (
                        <div
                          key={st.id}
                          className="d-flex flex-column p-3 rounded-3 bg-white border border-light-subtle shadow-xs mb-2 transition-all"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <label className={`d-flex align-items-center gap-2 flex-grow-1 min-w-0 mb-0 ${canUserToggleThisSubtask ? 'cursor-pointer' : 'cursor-default opacity-80'}`}>
                              {canUserToggleThisSubtask ? (
                                <input
                                  type="checkbox"
                                  checked={st.completed}
                                  disabled={subtaskLoadingId === st.id}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleSubtask(e as any, st.id);
                                  }}
                                  className="form-check-input mt-0 flex-shrink-0 cursor-pointer"
                                  style={{ width: '16px', height: '16px' }}
                                />
                              ) : (
                                st.completed ? (
                                  <CheckCircle2 style={{ width: '16px', height: '16px' }} className="text-primary flex-shrink-0" />
                                ) : (
                                  <Circle style={{ width: '16px', height: '16px' }} className="text-muted flex-shrink-0" />
                                )
                              )}
                              <span className={`text-dark text-truncate ${st.completed ? 'text-decoration-line-through text-muted opacity-60' : 'fw-semibold'}`} style={{ width: '100%' }}>
                                <span className="d-inline-flex flex-wrap align-items-center gap-2">
                                  {parsed.username && (
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                      @{parsed.username}
                                    </span>
                                  )}
                                  {parsed.hours && (
                                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                      {parsed.hours} hrs
                                    </span>
                                  )}
                                  {parsed.dueDate && (
                                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                      Due: {parsed.dueDate}
                                    </span>
                                  )}
                                  <span className="ms-1">{parsed.title}</span>
                                  {(() => {
                                    if (st.completed) return null;
                                    if (!parsed.dueDate) return null;
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const due = new Date(parsed.dueDate);
                                    due.setHours(0, 0, 0, 0);
                                    if (today > due) {
                                      return (
                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-0.5 ms-2 fw-bold" style={{ fontSize: '0.62rem' }}>
                                          ⚠️ BACKLOG
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-0.5 ms-2 fw-bold" style={{ fontSize: '0.62rem' }}>
                                        ⏱️ IN PROGRESS
                                      </span>
                                    );
                                  })()}
                                </span>
                              </span>
                            </label>

                            {canManageSubtasks && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSubtask(e, st.id)}
                                className="btn btn-sm btn-link text-danger p-0 border-0 ms-2 opacity-60 hover-opacity-100 transition-opacity"
                                title="Delete Subtask"
                              >
                                <Trash2 style={{ width: '14px', height: '14px' }} />
                              </button>
                            )}
                          </div>

                          {/* Attachment Section */}
                          <div className="d-flex align-items-center gap-2 mt-2.5 ps-4 text-xs">
                            {st.attachmentName ? (
                              <div className="d-flex align-items-center gap-1.5 bg-light border px-2 py-1 rounded shadow-xs text-dark" style={{ fontSize: '0.7rem' }}>
                                <span className="text-muted">📎</span>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDownloadAttachment(st.id, st.attachmentName || 'attachment');
                                  }}
                                  className="text-primary text-decoration-none fw-bold hover-underline text-truncate"
                                  style={{ maxWidth: '240px' }}
                                  title="Click to view/download screen"
                                >
                                  {st.attachmentName}
                                </a>
                                
                                {canManageSubtasks && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(st.id)}
                                    className="btn btn-link p-0 text-danger text-decoration-none ms-1.5 fw-bold border-0 bg-transparent"
                                    style={{ fontSize: '0.9rem', lineHeight: 1 }}
                                    title="Remove attachment"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ) : (
                              canManageSubtasks && (
                                <div className="d-flex align-items-center gap-1.5">
                                  <label className="btn btn-sm btn-light border px-2.5 py-1 rounded cursor-pointer text-muted hover-bg-white m-0 d-flex align-items-center gap-1 transition-all" style={{ fontSize: '0.68rem' }}>
                                    <span>📤 Add Screen/Document</span>
                                    <input
                                      type="file"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleUploadAttachment(st.id, e.target.files[0]);
                                        }
                                      }}
                                      className="d-none"
                                    />
                                  </label>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {subtasksList.length === 0 && (
                      <div className="text-muted small italic py-3 text-center bg-light rounded-3 border border-dashed" style={{ fontSize: '0.8rem' }}>
                        No subtasks added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Subtask Form */}
                {canManageSubtasks && !isAdmin && (
                  <div className="p-4 bg-light rounded-3 border mb-4">
                    <span className="fw-bold text-dark text-uppercase small d-block mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      Add New Subtask
                    </span>
                    <form onSubmit={handleAddSubtask} className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.65rem' }}>Subtask Title</label>
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="What needs to be done?"
                          className="form-control bg-white shadow-none text-sm rounded-3"
                          required
                        />
                      </div>
                      
                      <div className="row g-3">
                        <div className="col-12 col-md-5">
                          <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.65rem' }}>Developer</label>
                          <select
                            value={assigneeDevId}
                            onChange={(e) => setAssigneeDevId(e.target.value)}
                            className="form-select form-select-sm bg-white rounded-3 shadow-none text-sm fw-semibold text-dark"
                            required
                          >
                            <option value="">Select Developer</option>
                            {members
                              .filter((m) => {
                                if (!m || !m.user) return false;
                                const r = m.projectRole?.toUpperCase() || '';
                                const isDev = r.includes('DEVELOPER') || r.includes('ROLE_DEVELOPER');
                                if (!isDev) return false;

                                const isLead = user?.roles?.some(role => role === 'PROJECT_LEAD' || role === 'ROLE_PROJECT_LEAD');
                                const isPmOrAdmin = user?.roles?.some(role => role === 'PROJECT_MANAGER' || role === 'ROLE_PROJECT_MANAGER' || role === 'ADMIN' || role === 'ROLE_ADMIN');

                                if (isLead && !isPmOrAdmin) {
                                  return m.lead?.id === user?.id;
                                }
                                return true;
                              })
                              .map((m) => (
                                <option key={m.user.id} value={m.user.id}>
                                  {m.user.firstName} {m.user.lastName} (@{m.user.username})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="col-6 col-md-3">
                          <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.65rem' }}>Hours</label>
                          <input
                            type="number"
                            min="1"
                            value={subtaskEstHours || ''}
                            onChange={(e) => setSubtaskEstHours(Number(e.target.value))}
                            placeholder="Hours"
                            className="form-control form-control-sm bg-white rounded-3 shadow-none text-sm text-dark"
                            required
                          />
                        </div>

                        <div className="col-6 col-md-4">
                          <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.65rem' }}>Due Date</label>
                          <input
                            type="date"
                            value={subtaskDueDate}
                            onChange={(e) => setSubtaskDueDate(e.target.value)}
                            className="form-control form-control-sm bg-white rounded-3 shadow-none text-sm text-dark"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addingSubtask || !newSubtaskTitle.trim() || !assigneeDevId || subtaskEstHours <= 0 || !subtaskDueDate}
                        className="btn btn-primary bg-gradient-primary border-0 w-100 fw-bold py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-scale transition-all text-sm mt-2"
                      >
                        <Plus style={{ width: '18px', height: '18px' }} />
                        <span>{addingSubtask ? 'Adding Subtask...' : 'Add Subtask'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Document Attachment link if present */}
                {task.attachmentPath && (
                  <div className="mb-4 d-flex align-items-center justify-content-between p-3 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-25">
                    <a
                      href={`/api/v1/tasks/${task.id}/attachment`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center gap-2 text-decoration-none fw-semibold text-info text-truncate"
                    >
                      {task.attachmentType?.includes('image') ? (
                        <ImageIcon style={{ width: '18px', height: '18px' }} />
                      ) : (
                        <FileText style={{ width: '18px', height: '18px' }} />
                      )}
                      <span className="text-truncate">{task.attachmentName || 'Attachment Document'}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light border-0 px-4 py-3 d-flex justify-content-between">
                <div>
                  {canEditTask && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onCardClick?.(task);
                      }}
                      className="btn btn-sm btn-outline-primary border-dashed rounded-3 px-3 py-2 fw-semibold text-xs d-flex align-items-center gap-1.5 hover-scale transition-all"
                    >
                      <Edit3 style={{ width: '14px', height: '14px' }} />
                      <span>Full Edit Task Modal</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="btn btn-sm btn-secondary rounded-3 px-4 py-2 fw-semibold hover-scale transition-all"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Card Footer matching Image 1 (Assignee Avatar + Full Name on left, Clock + Timestamp on right) */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
        {/* Assignee Avatar Circle + Name matching Image 1 (e.g. SL Sara Lin, JC John Carter) */}
        <div className="d-flex align-items-center gap-1.5">
          {(() => {
            const assigneeMember = members.find(m => m.user?.id === task.assignee?.id);
            const isPmOrAdmin = user?.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER' || r === 'ADMIN' || r === 'ROLE_ADMIN') ?? false;
            const displayAssignee = (isPmOrAdmin && assigneeMember?.lead) ? assigneeMember.lead : task.assignee;

            return displayAssignee ? (
              <>
                <div
                  className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-xs"
                  style={{ width: '22px', height: '22px', fontSize: '0.62rem' }}
                >
                  {displayAssignee.firstName[0]}
                  {displayAssignee.lastName ? displayAssignee.lastName[0] : ''}
                </div>
                <span className="text-secondary fw-semibold" style={{ fontSize: '0.74rem' }}>
                  {displayAssignee.firstName} {displayAssignee.lastName}
                </span>
              </>
            ) : (
              <span className="text-muted italic" style={{ fontSize: '0.74rem' }}>
                Unassigned
              </span>
            );
          })()}
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
