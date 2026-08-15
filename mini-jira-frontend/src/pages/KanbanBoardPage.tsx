import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ApiResponse, Task, TaskStatus, Priority, Label, ProjectMember, ProjectResponse, Project } from '../types';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { useOptimisticKanban } from '../hooks/useOptimisticKanban';
import { useTaskFiltersUrlSync } from '../hooks/useTaskFiltersUrlSync';
import { useDebounce } from '../hooks/useDebounce';
import { ToastContainer } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils';
import { getFriendlyError } from '../services/apiClient';
import { RefreshCw, Plus, X, Edit3, Clock, FileText, CheckCircle2, FolderKanban, ChevronDown } from 'lucide-react';

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [firstProjectId, setFirstProjectId] = useState<string>('1');
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalProjectId, setModalProjectId] = useState<string>('');

  // Modal & form states for Task creation/editing
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [targetStatusId, setTargetStatusId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriorityId, setTaskPriorityId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskLeadId, setTaskLeadId] = useState('');
  const [taskDeveloperId, setTaskDeveloperId] = useState('');
  const [taskEstHours, setTaskEstHours] = useState<number>(0);
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    apiClient.get('/projects').then((res) => {
      if (res.data?.success && res.data?.data?.length > 0) {
        setProjects(res.data.data);
        setFirstProjectId(String(res.data.data[0].id));
      }
    }).catch(() => {});
  }, []);

  const activeProjectId = projectId || firstProjectId;
  const queryProjectId = isTaskModalOpen ? (modalProjectId || activeProjectId) : activeProjectId;

  // 1. Two-way URL Sync Hook
  const { filters, setFilters, resetFilters } = useTaskFiltersUrlSync();

  // 2. Debounced search keyword (350ms)
  const debouncedSearch = useDebounce(filters.search, 350);

  // 3. Fetch Active Project Details (for time frame checks)
  const { data: projectData } = useQuery({
    queryKey: ['projects', queryProjectId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ProjectResponse>>(`/projects/${queryProjectId}`);
      return res.data.data;
    },
  });

  // Fetch Workflow Statuses
  const { data: statusesData, isLoading: isStatusesLoading } = useQuery({
    queryKey: ['projects', queryProjectId, 'statuses'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TaskStatus[]>>(`/projects/${queryProjectId}/statuses`);
      return res.data.data || [];
    },
  });

  // 4. Fetch Priorities
  const { data: prioritiesData } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Priority[]>>('/priorities');
      return res.data.data || [];
    },
  });

  // 5. Fetch Project Members
  const { data: membersData } = useQuery({
    queryKey: ['projects', queryProjectId, 'members'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${queryProjectId}/members`);
      return res.data.data || [];
    },
  });

  // 6. Fetch Project Labels
  const { data: labelsData } = useQuery({
    queryKey: ['projects', queryProjectId, 'labels'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Label[]>>(`/projects/${queryProjectId}/labels`);
      return res.data.data || [];
    },
  });

  // Derive stable filter values for queryKey and queryFn
  const searchTerm   = debouncedSearch.trim();
  const priorityVal  = filters.priorityId;
  const statusVal    = filters.statusId;
  const assigneeVal  = filters.assigneeId;
  const labelVal     = filters.labelId;

  // 7. Search & Filtered Tasks API Query with keepPreviousData for smooth inline card reloading
  const { data: tasksData, isFetching: isTasksFetching, refetch: refetchTasks } = useQuery({
    queryKey: [
      'projects',
      activeProjectId,
      'tasks',
      'search',
      searchTerm,
      priorityVal,
      statusVal,
      assigneeVal,
      labelVal,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm)   params.set('search',     searchTerm);
      if (priorityVal)  params.set('priorityId', priorityVal);
      if (statusVal)    params.set('statusId',   statusVal);
      if (assigneeVal)  params.set('assigneeId', assigneeVal);
      if (labelVal)     params.set('labelId',    labelVal);

      const queryString = params.toString();
      const url = queryString
        ? `/projects/${activeProjectId}/tasks/search?${queryString}`
        : `/projects/${activeProjectId}/tasks`;

      const res = await apiClient.get<ApiResponse<Task[]>>(url);
      return res.data.data || [];
    },
    placeholderData: keepPreviousData,
  });

  const DEFAULT_4_STATUSES: TaskStatus[] = [
    { id: 1, name: 'Backlog', code: 'BACKLOG', displayOrder: 1, color: '#94a3b8', capacityLimit: 0, active: true },
    { id: 2, name: 'To Do', code: 'TODO', displayOrder: 2, color: '#3b82f6', capacityLimit: 0, active: true },
    { id: 3, name: 'In Progress', code: 'IN_PROGRESS', displayOrder: 3, color: '#f59e0b', capacityLimit: 3, active: true },
    { id: 4, name: 'Done', code: 'DONE', displayOrder: 4, color: '#10b981', capacityLimit: 0, active: true },
  ];

  const rawStatuses = (statusesData && statusesData.length > 0) ? statusesData : DEFAULT_4_STATUSES;
  const hasBacklog = rawStatuses.some(s => s.code === 'BACKLOG');
  const statuses = hasBacklog
    ? [...rawStatuses].sort((a, b) => a.displayOrder - b.displayOrder)
    : [DEFAULT_4_STATUSES[0], ...rawStatuses].sort((a, b) => a.displayOrder - b.displayOrder);

  const initialTasks = tasksData || [];

  const getLocalDateString = (isoStr?: string) => isoStr ? isoStr.split('T')[0] : '';
  const toIsoInstant = (dateStr: string) => dateStr ? `${dateStr}T00:00:00Z` : null;

  const handleOpenAddTask = (statusId: number) => {
    setSelectedTask(null);
    setTargetStatusId(statusId);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriorityId(prioritiesData && prioritiesData.length > 0 ? String(prioritiesData[0].id) : '');
    setTaskAssigneeId('');
    setTaskLeadId('');
    setTaskDeveloperId('');
    setTaskEstHours(0);
    setModalProjectId(activeProjectId);
    setTaskStartDate(projectData?.startDate || '');
    setTaskEndDate(projectData?.endDate || '');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setSelectedTask(task);
    setTargetStatusId(null);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriorityId(String(task.priority?.id || ''));
    
    const assigneeIdVal = task.assignee?.id ? String(task.assignee.id) : '';
    setTaskAssigneeId(assigneeIdVal);

    const memberObj = (membersData || []).find(m => String(m.user?.id) === assigneeIdVal);
    if (memberObj) {
      const role = memberObj.projectRole?.toUpperCase() || '';
      if (role.includes('LEAD')) {
        setTaskLeadId(assigneeIdVal);
        setTaskDeveloperId('');
      } else if (role.includes('DEVELOPER')) {
        setTaskLeadId(memberObj.lead?.id ? String(memberObj.lead.id) : '');
        setTaskDeveloperId(assigneeIdVal);
      } else {
        setTaskLeadId('');
        setTaskDeveloperId(assigneeIdVal);
      }
    } else {
      setTaskLeadId('');
      setTaskDeveloperId('');
    }

    setTaskEstHours(task.estimatedHours || 0);
    setModalProjectId(String(task.projectId || activeProjectId));
    setTaskStartDate(getLocalDateString(task.startDate) || projectData?.startDate || '');
    setTaskEndDate(getLocalDateString(task.endDate) || projectData?.endDate || '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showErrorAlert('Invalid Title', 'Task title is required.');
      return;
    }

    const currentModalProjId = modalProjectId || activeProjectId;

    // Validate date bounds against project dates
    if (projectData) {
      if (taskStartDate && projectData.startDate && taskStartDate < projectData.startDate) {
        showErrorAlert('Out of Time Frame', `Task start date cannot be before project start date (${projectData.startDate}).`);
        return;
      }
      if (taskEndDate && projectData.endDate && taskEndDate > projectData.endDate) {
        showErrorAlert('Out of Time Frame', `Task end date cannot be after project end date (${projectData.endDate}).`);
        return;
      }
      if (taskStartDate && taskEndDate && taskEndDate < taskStartDate) {
        showErrorAlert('Invalid Dates', 'Task end date must be on or after start date.');
        return;
      }
    }

    const isPm = user?.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER');
    const isLead = user?.roles?.some(r => r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD');
    const isAdmin = user?.roles?.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');

    let finalAssigneeId: number | null = null;
    if (isPm || isAdmin) {
      if (taskDeveloperId) {
        finalAssigneeId = Number(taskDeveloperId);
      } else if (taskLeadId) {
        finalAssigneeId = Number(taskLeadId);
      }
    } else if (isLead) {
      if (taskDeveloperId) {
        finalAssigneeId = Number(taskDeveloperId);
      }
    } else {
      if (taskAssigneeId) {
        finalAssigneeId = Number(taskAssigneeId);
      }
    }

    setSavingTask(true);
    try {
      if (selectedTask) {
        // Edit existing task
        const payload = {
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          priorityId: Number(taskPriorityId),
          assigneeId: finalAssigneeId,
          estimatedHours: Number(taskEstHours) || 0,
          startDate: toIsoInstant(taskStartDate),
          endDate: toIsoInstant(taskEndDate),
        };
        const res = await apiClient.patch(`/tasks/${selectedTask.id}`, payload);
        if (res.data?.success) {
          showSuccessAlert('Task Updated', 'Task properties updated successfully.');
          setIsTaskModalOpen(false);
          refetchTasks();
        }
      } else {
        // Create new task
        const payload = {
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          statusId: Number(targetStatusId),
          priorityId: Number(taskPriorityId),
          assigneeId: finalAssigneeId,
          estimatedHours: Number(taskEstHours) || 0,
          startDate: toIsoInstant(taskStartDate),
          endDate: toIsoInstant(taskEndDate),
        };
        const res = await apiClient.post(`/projects/${currentModalProjId}/tasks`, payload);
        if (res.data?.success) {
          showSuccessAlert('Task Created', 'New task added to board successfully.');
          setIsTaskModalOpen(false);
          refetchTasks();
        }
      }
    } catch (err: any) {
      showErrorAlert('Save Failed', getFriendlyError(err));
    } finally {
      setSavingTask(false);
    }
  };

  const { tasks, moveTask, toasts, removeToast } = useOptimisticKanban({
    initialTasks,
    statuses,
    enableSimulation: true,
  });

  if (isStatusesLoading && !statusesData) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '380px' }}>
        <RefreshCw className="animate-spin text-primary me-2" style={{ width: '24px', height: '24px' }} />
        <span className="fw-semibold small">Loading Workspace...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-3 w-100" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* View Header Bar with Dual-View Toggle */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1 flex-wrap">
            <h2 className="h4 fw-bold text-dark mb-0">Kanban Workspace</h2>
            {isTasksFetching && (
              <span className="badge bg-light text-primary border rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 small shadow-xs" style={{ fontSize: '0.72rem' }}>
                <RefreshCw className="animate-spin text-primary" style={{ width: '12px', height: '12px' }} />
                Updating cards...
              </span>
            )}

            {/* Project Switcher — only visible when user has 2+ projects */}
            {projects.length > 1 && (
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative d-flex align-items-center">
                  <FolderKanban
                    className="text-primary position-absolute"
                    style={{ width: '14px', height: '14px', left: '10px', pointerEvents: 'none', zIndex: 1 }}
                  />
                  <select
                    value={activeProjectId}
                    onChange={(e) => {
                      resetFilters();
                      navigate(`/projects/${e.target.value}/board`);
                    }}
                    className="form-select form-select-sm fw-semibold border rounded-3 shadow-sm"
                    style={{
                      paddingLeft: '30px',
                      fontSize: '0.78rem',
                      minWidth: '180px',
                      background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
                      color: '#3730a3',
                      borderColor: '#c7d2fe',
                      cursor: 'pointer'
                    }}
                  >
                    {projects.map((p: any) => (
                      <option key={p.id} value={String(p.id)}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Dual-View Navigation Tab Bar */}
            <div className="btn-group btn-group-sm bg-white p-1 rounded-3 border shadow-xs">
              <button
                type="button"
                className="btn btn-sm btn-primary bg-gradient-primary fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Board View
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate(`/projects/${activeProjectId}/gantt${location.search}`);
                }}
                className="btn btn-sm btn-light text-muted hover-text-dark fw-semibold rounded-2 px-3 py-1 text-xs"
              >
                Gantt Timeline View
              </button>
            </div>
          </div>
          <p className="small text-muted mb-0">
            {projects.length > 1
              ? `Viewing: ${projects.find((p: any) => String(p.id) === activeProjectId)?.name || 'Project'} — switch projects using the dropdown above`
              : 'Multi-criteria search, two-way URL sync, expandable cards, and optimistic UI state engine.'}
          </p>
        </div>

      </div>

      {/* Multi-criteria Filter Controls Bar */}
      <TaskFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        priorities={prioritiesData || []}
        statuses={statuses}
        members={membersData || []}
        labels={labelsData || []}
      />

      {/* Kanban Board Container */}
      <KanbanBoard
        statuses={statuses}
        tasks={tasks}
        onTaskMove={moveTask}
        onTaskClick={handleOpenEditTask}
        onAddTaskClick={handleOpenAddTask}
      />

      {/* Task Add / Edit Modal */}
      {isTaskModalOpen && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-primary text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>
                  {selectedTask ? 'Edit Task Details' : 'Create New Task'}
                </h5>
                <button onClick={() => setIsTaskModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleSaveTask} className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Project</label>
                  {selectedTask ? (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={projects.find(p => String(p.id) === modalProjectId)?.name || 'Active Project'}
                      className="form-control form-control-sm bg-light rounded-3 text-muted text-sm fw-semibold"
                    />
                  ) : (
                    <select
                      value={modalProjectId}
                      onChange={(e) => {
                        const newPid = e.target.value;
                        setModalProjectId(newPid);
                        setTaskAssigneeId('');
                      }}
                      className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    placeholder="Enter task summary..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Description</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    placeholder="Add detailed task scope..."
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Priority</label>
                    <select
                      value={taskPriorityId}
                      onChange={(e) => setTaskPriorityId(e.target.value)}
                      className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    >
                      {(prioritiesData || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Est. Hours</label>
                    <input
                      type="number"
                      min={0}
                      value={taskEstHours}
                      onChange={(e) => setTaskEstHours(Number(e.target.value) || 0)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Start Date</label>
                    <input
                      type="date"
                      min={projectData?.startDate || undefined}
                      max={projectData?.endDate || undefined}
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>End Date</label>
                    <input
                      type="date"
                      min={taskStartDate || projectData?.startDate || undefined}
                      max={projectData?.endDate || undefined}
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                </div>

                {/* Task Assignee Selector Section */}
                {(() => {
                  const isPm = user?.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER');
                  const isLead = user?.roles?.some(r => r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD');
                  const isAdmin = user?.roles?.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');

                  if (isPm || isAdmin) {
                    return (
                      <div className="d-flex flex-column gap-3 mb-4">
                        <div>
                          <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                            Assign to Project Lead <span className="text-muted fw-normal">(Optional)</span>
                          </label>
                          <select
                            value={taskLeadId}
                            onChange={(e) => {
                              setTaskLeadId(e.target.value);
                              setTaskDeveloperId('');
                            }}
                            className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                          >
                            <option value="">Unassigned</option>
                            {(membersData || [])
                              .filter(m => m.projectRole?.toUpperCase() === 'PROJECT_LEAD' || m.projectRole?.toUpperCase() === 'ROLE_PROJECT_LEAD')
                              .map((m) => (
                                <option key={m.user.id} value={m.user.id}>
                                  {m.user.firstName} {m.user.lastName} (@{m.user.username})
                                </option>
                              ))}
                          </select>
                        </div>

                        {taskLeadId && (
                          <div className="animate-fade-in">
                            <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                              Assign to Developer <span className="text-muted fw-normal">(Optional)</span>
                            </label>
                            <select
                              value={taskDeveloperId}
                              onChange={(e) => setTaskDeveloperId(e.target.value)}
                              className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                            >
                              <option value="">No Developer (Assign to Project Lead)</option>
                              {(membersData || [])
                                .filter(m => {
                                  const isDev = m.projectRole?.toUpperCase() === 'DEVELOPER' || m.projectRole?.toUpperCase() === 'ROLE_DEVELOPER';
                                  if (isDev) {
                                    console.log("[Developer Filter Debug] Member:", m.user?.username, "m.lead:", m.lead, "Selected Lead ID:", taskLeadId);
                                  }
                                  const leadIdStr = m.lead?.id ? String(m.lead.id) : '';
                                  return isDev && leadIdStr === taskLeadId;
                                })
                                .map((m) => (
                                  <option key={m.user.id} value={m.user.id}>
                                    {m.user.firstName} {m.user.lastName} (@{m.user.username})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isLead) {
                    return (
                      <div className="mb-4">
                        <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                          Assign to Developer <span className="text-muted fw-normal">(Optional)</span>
                        </label>
                        <select
                          value={taskDeveloperId}
                          onChange={(e) => setTaskDeveloperId(e.target.value)}
                          className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                        >
                          <option value="">Unassigned</option>
                           {(membersData || [])
                            .filter(m => {
                              const isDev = m.projectRole?.toUpperCase() === 'DEVELOPER' || m.projectRole?.toUpperCase() === 'ROLE_DEVELOPER';
                              if (isDev) {
                                console.log("[Lead Task Assignee Debug] Member:", m.user?.username, "m.lead:", m.lead, "Current User ID:", user?.id);
                              }
                              return isDev && m.lead?.id === user?.id;
                            })
                            .map((m) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.firstName} {m.user.lastName} (@{m.user.username})
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div className="mb-4">
                      <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                        Assignee <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <select
                        value={taskAssigneeId}
                        onChange={(e) => setTaskAssigneeId(e.target.value)}
                        className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                      >
                        <option value="">Unassigned</option>
                        {(membersData || []).map((m) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.firstName} {m.user.lastName} (@{m.user.username}) - {m.projectRole?.replace('ROLE_', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 shadow-sm"
                  >
                    {savingTask ? 'Saving...' : selectedTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
