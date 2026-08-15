import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  X,
  Zap,
  Target,
  UserCheck,
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, ProjectResponse, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';
import { formatDateDDMMYYYY, getTodayLocalStr, getFutureLocalStr } from '../utils/dateUtils';
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProjectsOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    managerId: '',
  });

  // Sprint Planning Form State
  const [sprintData, setSprintData] = useState({
    sprintName: '',
    sprintGoal: '',
    startDate: '',
    endDate: '',
    targetHours: 40,
    assignedLeadId: '',
  });

  // Assign Members State (for PM role)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [assignRoleCode, setAssignRoleCode] = useState('PROJECT_LEAD');
  const [assigning, setAssigning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [developerLeadMap, setDeveloperLeadMap] = useState<Record<number, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, userRes, allUsersRes] = await Promise.all([
        apiClient.get<ApiResponse<ProjectResponse[]>>('/projects'),
        apiClient.get<ApiResponse<User[]>>('/users?role=PROJECT_MANAGER,ADMIN').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get<ApiResponse<User[]>>('/users').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (projRes.data.success && projRes.data.data) {
        setProjects(projRes.data.data);
      }
      if (userRes.data?.success && userRes.data?.data) {
        setUsers(userRes.data.data);
      }
      if (allUsersRes.data?.success && allUsersRes.data?.data) {
        setAllUsers(allUsersRes.data.data);
      }
    } catch (err: any) {
      // If error, keep empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Role Hierarchy Flags ──────────────────────────────────────────────
  // ADMIN         : full project CRUD + create/edit/delete/sprint
  // PROJECT_MANAGER: assign project leads & developers to projects only
  // PROJECT_LEAD  : tasks + subtasks + sprint planning (no project CRUD)
  // DEVELOPER     : own assigned tasks + subtasks only
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN') ?? false;
  const isPm    = user?.roles?.some((r) => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER') ?? false;
  const isLead  = user?.roles?.some((r) => r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD') ?? false;

  // Only Admin can create / edit / delete projects
  const canManageProjects = isAdmin;
  // Admin + Lead can plan sprints
  const canPlanSprint = isAdmin || isLead;
  // PM can assign members to projects
  const canAssignMembers = isPm;
  // Legacy alias kept for member-management pages
  const isAdminOrPm = isAdmin || isPm || isLead;

  const projectManagers = useMemo(() => {
    const pmUsers = users.filter((u) =>
      u.roles?.some(
        (r) =>
          r === 'PROJECT_MANAGER' ||
          r === 'ROLE_PROJECT_MANAGER' ||
          r === 'ADMIN' ||
          r === 'ROLE_ADMIN'
      )
    );
    return pmUsers.length > 0 ? pmUsers : users;
  }, [users]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
      startDate: getTodayLocalStr(),
      endDate: getFutureLocalStr(90),
      managerId: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectResponse) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      status: project.status || 'ACTIVE',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      managerId: '',
    });
    setIsEditModalOpen(true);
  };

  const todayStr = getTodayLocalStr();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startDate && formData.startDate < todayStr) {
      showErrorAlert('Invalid Start Date', 'Project start date cannot be in the past. Select today or a future date.');
      return;
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      showErrorAlert('Invalid End Date', 'Project end date must be on or after the start date.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description?.trim() || null,
      startDate: formData.startDate ? formData.startDate : null,
      endDate: formData.endDate ? formData.endDate : null,
    };

    try {
      const res = await apiClient.post<ApiResponse<ProjectResponse>>('/projects', payload);
      if (res.data.success && res.data.data) {
        const createdProject = res.data.data;
        // If Project Manager selected, assign them to project
        if (formData.managerId) {
          try {
            await apiClient.post(`/projects/${createdProject.id}/members`, {
              userId: Number(formData.managerId),
              roleCode: 'PROJECT_MANAGER',
            });
          } catch (err) {}
        }
        showSuccessAlert('Project Created', `Project "${formData.name}" created and Project Manager assigned successfully.`);
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showErrorAlert('Creation Failed', err.response?.data?.error?.message || 'Failed to create project.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (formData.startDate && formData.startDate < todayStr) {
      showErrorAlert('Invalid Start Date', 'Project start date cannot be in the past. Select today or a future date.');
      return;
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      showErrorAlert('Invalid End Date', 'Project end date must be on or after the start date.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      status: formData.status,
      startDate: formData.startDate ? formData.startDate : null,
      endDate: formData.endDate ? formData.endDate : null,
    };

    try {
      const res = await apiClient.put<ApiResponse<ProjectResponse>>(`/projects/${selectedProject.id}`, payload);
      if (res.data.success) {
        showSuccessAlert('Project Updated', `Project "${formData.name}" has been updated successfully.`);
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showErrorAlert('Update Failed', err.response?.data?.error?.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async (project: ProjectResponse) => {
    const confirmed = await showConfirmAlert(
      `Delete Project "${project.name}"?`,
      'This action is irreversible and will delete all associated tasks and board metrics.',
      'Delete Project'
    );
    if (confirmed) {
      try {
        await apiClient.delete(`/projects/${project.id}`);
        showSuccessAlert('Project Deleted', `Project "${project.name}" has been removed.`);
        fetchData();
      } catch (err: any) {
        showErrorAlert('Delete Failed', err.response?.data?.error?.message || 'Failed to delete project.');
      }
    }
  };

  const handleOpenSprintPlanning = (project: ProjectResponse) => {
    setSelectedProject(project);
    setSprintData({
      sprintName: `Sprint 1: ${project.code} Launch`,
      sprintGoal: `Deliver sprint milestones and board backlog tasks for ${project.name}`,
      startDate: getTodayLocalStr(),
      endDate: getFutureLocalStr(14),
      targetHours: 40,
      assignedLeadId: '',
    });
    setIsSprintModalOpen(true);
  };


  const handleSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    showSuccessAlert(
      'Sprint Planned & Launched',
      `Sprint "${sprintData.sprintName}" created for Project ${selectedProject.name} (Goal: ${sprintData.sprintGoal}).`
    );
    setIsSprintModalOpen(false);
  };

  const getAlreadyAssignedUserIds = (proj: ProjectResponse, roleCode: string) => {
    if (!proj || !proj.members) return [];
    return proj.members
      .filter((m) => m.projectRole === roleCode || m.projectRole === `ROLE_${roleCode}`)
      .map((m) => m.user.id);
  };

  // PM: Open Assign Members Modal
  const handleOpenAssignMembers = (project: ProjectResponse) => {
    setSelectedProject(project);
    const initialUserIds = getAlreadyAssignedUserIds(project, 'PROJECT_LEAD');
    setSelectedUserIds(initialUserIds);
    setAssignRoleCode('PROJECT_LEAD');

    // Initialize developerLeadMap
    const initialLeadMap: Record<number, number> = {};
    project.members?.forEach(m => {
      const r = m.projectRole?.toUpperCase() || '';
      if ((r.includes('DEVELOPER') || r.includes('ROLE_DEVELOPER')) && m.lead && m.active) {
        initialLeadMap[m.user.id] = m.lead.id;
      }
    });
    setDeveloperLeadMap(initialLeadMap);

    setIsAssignModalOpen(true);
  };

  // PM: Submit multiselect assignment
  const handleAssignMembersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setAssigning(true);
    try {
      const originallyAssigned = getAlreadyAssignedUserIds(selectedProject, assignRoleCode);
      const toAdd = selectedUserIds.filter(id => !originallyAssigned.includes(id));
      const toRemove = originallyAssigned.filter(id => !selectedUserIds.includes(id));

      const addPromises = toAdd.map((uid) => {
        const leadId = assignRoleCode === 'DEVELOPER' ? developerLeadMap[uid] : undefined;
        return apiClient.post(`/projects/${selectedProject.id}/members`, {
          userId: uid,
          roleCode: assignRoleCode,
          leadId: leadId || null,
        });
      });

      // Also support updating lead for already assigned developers who are still selected
      const updatePromises: Promise<any>[] = [];
      if (assignRoleCode === 'DEVELOPER') {
        const intersection = selectedUserIds.filter(id => originallyAssigned.includes(id));
        for (const uid of intersection) {
          const originallyAssignedLeadId = selectedProject.members?.find(m => m.user.id === uid && m.projectRole?.toUpperCase().includes('DEVELOPER'))?.lead?.id;
          const currentLeadId = developerLeadMap[uid];
          if (currentLeadId !== originallyAssignedLeadId) {
            updatePromises.push(
              apiClient.post(`/projects/${selectedProject.id}/members`, {
                userId: uid,
                roleCode: assignRoleCode,
                leadId: currentLeadId || null,
              })
            );
          }
        }
      }

      const removePromises = toRemove.map((uid) =>
        apiClient.delete(`/projects/${selectedProject.id}/members/${uid}`)
      );

      const results = await Promise.allSettled([...addPromises, ...removePromises, ...updatePromises]);
      
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (toAdd.length === 0 && toRemove.length === 0 && updatePromises.length === 0) {
        showSuccessAlert('No Changes', 'No member assignments were changed.');
      } else if (failed === 0) {
        showSuccessAlert(
          'Members Synchronized',
          `Successfully updated member assignments for project "${selectedProject.name}".`
        );
      } else {
        showSuccessAlert(
          'Members Updated',
          `Updated member assignments with ${succeeded} changes completed and ${failed} failures.`
        );
      }
    } catch (err: any) {
      showErrorAlert('Sync Failed', err.response?.data?.error?.message || 'Failed to update member assignments.');
    } finally {
      setAssigning(false);
      setIsAssignModalOpen(false);
      fetchData();
    }
  };

  // Toggle user selection in multiselect
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1280px' }}>
      {/* Top Header & Fast Action Bar */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold mb-0 text-dark">ProjectPulse Projects</h1>
              <span className="badge badge-subtle-primary rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                {filteredProjects.length} Active
              </span>
            </div>
            <p className="small text-muted mb-0">
              Centralized directory of workspace project tenants, engineering pipelines, and milestones.
            </p>
          </div>

          {/* Create Project — PM only */}
          {canManageProjects && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary bg-gradient-primary border-0 rounded-3 px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2 shrink-0"
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Create New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mb-4">
        {/* Search Bar */}
        <div className="input-group input-group-sm w-100" style={{ maxWidth: '320px' }}>
          <span className="input-group-text bg-white border-end-0 text-muted rounded-start-3">
            <Search style={{ width: '14px', height: '14px' }} />
          </span>
          <input
            type="text"
            placeholder="Search projects by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control bg-white border-start-0 shadow-none text-sm rounded-end-3"
          />
        </div>

        {/* Status Filter Tabs */}
        <ul className="nav nav-pills bg-light p-1 rounded-3 border">
          {['ALL', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].map((st) => (
            <li className="nav-item" key={st}>
              <button
                onClick={() => setStatusFilter(st)}
                className={`nav-link btn-sm py-1 px-3 fw-bold rounded-2 ${
                  statusFilter === st ? 'active bg-white text-dark shadow-xs' : 'text-secondary'
                }`}
                style={{ fontSize: '0.75rem' }}
              >
                {st}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects Grid split with Calendar Widget: Calendar Left, Projects Right */}
      <div className="row g-4 mb-5">
        {/* Left Column: Calendar Widget */}
        <div className="col-12 col-lg-4 animate-fade-in">
          <DashboardCalendar
            projects={projects}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Right Column: Projects & Events */}
        <div className="col-12 col-lg-8">
          {loading ? (
            <LoadingSpinner message="Loading workspace projects..." />
          ) : filteredProjects.length === 0 ? (
            <div className="card card-glass p-5 rounded-4 border-0 text-center max-w-md mx-auto my-5">
              <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-center text-primary mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                <FolderKanban style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 className="h6 fw-bold text-dark mb-1">No Projects Found</h3>
              <p className="small text-muted mb-4">
                There are currently no projects matching your search criteria or active filter.
              </p>
              {canManageProjects && (
                <button
                  onClick={handleOpenCreate}
                  className="btn btn-sm btn-primary bg-gradient-primary border-0 rounded-3 px-4 py-2 fw-semibold mx-auto"
                >
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="col-12 col-md-6">
                  <div className="card card-glass card-hover-lift rounded-4 border-0 p-4 d-flex flex-column justify-content-between h-100 position-relative overflow-hidden">
                    {/* Top Card Gradient Bar */}
                    <div className="position-absolute top-0 start-0 end-0 bg-gradient-primary" style={{ height: '4px' }}></div>

                    <div>
                      {/* Header Info */}
                      <div className="d-flex align-items-center justify-content-between mb-3 pt-1">
                        <span className="badge badge-subtle-primary text-uppercase fw-bold rounded-2 px-2 py-1" style={{ fontSize: '0.7rem' }}>
                          {project.code}
                        </span>
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fw-bold ${
                            project.status === 'ACTIVE' ? 'badge-subtle-success' : 'bg-light text-secondary border'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {project.status}
                        </span>
                      </div>

                      <h3 className="h6 fw-bold text-dark mb-2 text-truncate" style={{ fontSize: '1.05rem' }}>
                        {project.name}
                      </h3>
                      <p className="small text-secondary mb-4 text-truncate-2" style={{ fontSize: '0.8rem', minHeight: '38px' }}>
                        {project.description || 'Enterprise workspace tenant project with Kanban sprint tracking.'}
                      </p>
                    </div>

                    <div className="pt-3 border-top mt-auto">
                      {/* Dates & Members */}
                      <div className="d-flex align-items-center justify-content-between small text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                        <div className="d-flex align-items-center gap-1.5">
                          <Calendar style={{ width: '14px', height: '14px' }} />
                          <span>{project.startDate ? formatDateDDMMYYYY(project.startDate) : 'No start date'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5">
                          <Users style={{ width: '14px', height: '14px' }} />
                          <span>{project.members?.length ?? 0} Member{(project.members?.length ?? 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Sprint Completion — calculated from real task data */}
                      <div className="mb-3">
                        {(() => {
                          const totalTasks = project.taskCount ?? 0;
                          const completedTasks = project.completedTaskCount ?? 0;
                          const percentage = project.status === 'COMPLETED'
                            ? 100
                            : totalTasks > 0
                              ? Math.round((completedTasks / totalTasks) * 100)
                              : null;

                          return (
                            <>
                              <div className="d-flex align-items-center justify-content-between small fw-bold text-dark mb-1" style={{ fontSize: '0.72rem' }}>
                                <span>Sprint Completion</span>
                                {percentage === null ? (
                                  <span className="text-muted fw-normal" style={{ fontSize: '0.68rem' }}>— No tasks yet</span>
                                ) : (
                                  <span className={project.status === 'COMPLETED' || percentage === 100 ? "text-success fw-bold" : "text-primary fw-bold"}>
                                    {percentage}% {percentage === 100 ? '✓' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="progress rounded-pill bg-light border" style={{ height: '6px' }}>
                                <div
                                  className={`progress-bar rounded-pill transition-all ${project.status === 'COMPLETED' || percentage === 100 ? 'bg-success' : 'bg-gradient-primary'}`}
                                  role="progressbar"
                                  style={{ width: `${percentage ?? 0}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex align-items-center justify-content-between pt-1">
                        <button
                          onClick={() => navigate(`/projects/${project.id}/board`)}
                          className="btn btn-sm btn-link text-primary text-decoration-none fw-bold p-0 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <span>Open Kanban Board</span>
                          <ArrowRight style={{ width: '14px', height: '14px' }} />
                        </button>

                        <div className="d-flex align-items-center gap-1">
                          {canAssignMembers && (
                            <button
                              onClick={() => handleOpenAssignMembers(project)}
                              className="btn btn-sm btn-light text-primary p-1 rounded-2 d-flex align-items-center gap-1 px-2 border"
                              title="Assign Members"
                              style={{ fontSize: '0.72rem' }}
                            >
                              <UserCheck style={{ width: '13px', height: '13px' }} />
                              <span className="fw-semibold">Assign Members</span>
                            </button>
                          )}

                          {canPlanSprint && (
                            <button
                              onClick={() => handleOpenSprintPlanning(project)}
                              className="btn btn-sm btn-light text-primary p-1 rounded-2 d-flex align-items-center gap-1 px-2 border"
                              title="Plan Sprint"
                              style={{ fontSize: '0.72rem' }}
                            >
                              <Zap style={{ width: '13px', height: '13px' }} />
                              <span className="fw-semibold">Plan Sprint</span>
                            </button>
                          )}

                          {canManageProjects && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(project)}
                                className="btn btn-sm btn-light text-muted p-1 rounded-2"
                                title="Edit Project"
                              >
                                <Edit3 style={{ width: '15px', height: '15px' }} />
                              </button>

                              <button
                                onClick={() => handleDeleteProject(project)}
                                className="btn btn-sm btn-light text-danger p-1 rounded-2"
                                title="Delete Project"
                              >
                                <Trash2 style={{ width: '15px', height: '15px' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events Section below Projects (Only displayed if there are events starting/ending on selectedDate) */}
          {(() => {
            const formatDateLocal = (date: Date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            };
            const dateStr = formatDateLocal(selectedDate);
            const starts = projects.filter(p => p.startDate === dateStr);
            const ends = projects.filter(p => p.endDate === dateStr);
            const hasEvents = starts.length > 0 || ends.length > 0;

            if (!hasEvents) return null; // hides completely if no events

            return (
              <div className="card card-glass border-0 rounded-4 shadow-sm p-4 mt-4 animate-fade-in">
                <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Target style={{ width: '16px', height: '16px' }} className="text-primary" />
                  <span>Events for {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </h3>

                <div className="d-flex flex-column gap-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {starts.map(p => (
                    <div
                      key={`start-${p.id}`}
                      onClick={() => navigate(`/projects/${p.id}/board`)}
                      className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-20 cursor-pointer hover-shadow transition-all d-flex align-items-center justify-content-between"
                    >
                      <div className="min-w-0">
                        <span className="badge bg-success text-white text-uppercase fw-extrabold rounded-1 px-1.5 py-0.5 me-2" style={{ fontSize: '0.58rem' }}>
                          Starts Today
                        </span>
                        <span className="fw-bold text-dark text-sm block mt-1 text-truncate">{p.name}</span>
                      </div>
                      <ArrowRight style={{ width: '14px', height: '14px' }} className="text-success flex-shrink-0" />
                    </div>
                  ))}
                  {ends.map(p => (
                    <div
                      key={`end-${p.id}`}
                      onClick={() => navigate(`/projects/${p.id}/board`)}
                      className="p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 cursor-pointer hover-shadow transition-all d-flex align-items-center justify-content-between"
                    >
                      <div className="min-w-0">
                        <span className="badge bg-danger text-white text-uppercase fw-extrabold rounded-1 px-1.5 py-0.5 me-2" style={{ fontSize: '0.58rem' }}>
                          Ends Today
                        </span>
                        <span className="fw-bold text-dark text-sm block mt-1 text-truncate">{p.name}</span>
                      </div>
                      <ArrowRight style={{ width: '14px', height: '14px' }} className="text-danger flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Create ProjectPulse Project</h5>
                <button onClick={() => setIsCreateModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleCreateSubmit} className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-8">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ProjectPulse Platform"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Project Code</label>
                    <input
                      type="text"
                      required
                      placeholder="NEXUS"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm text-uppercase"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the scope and deliverables of this project..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Assign Project Lead / Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold text-dark"
                  >
                    <option value="">Select Project Manager (Optional)</option>
                    {projectManagers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Start Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>End Date</label>
                    <input
                      type="date"
                      min={formData.startDate || todayStr}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 shadow-sm"
                  >
                    Save Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Edit Project Details</h5>
                <button onClick={() => setIsEditModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleEditSubmit} className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-8">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Project Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Assign Project Lead / Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold text-dark"
                  >
                    <option value="">Select Project Manager (Optional)</option>
                    {projectManagers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Start Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>End Date</label>
                    <input
                      type="date"
                      min={formData.startDate || todayStr}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 shadow-sm"
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Planning Modal */}
      {isSprintModalOpen && selectedProject && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-dark-header text-white border-0 px-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Zap className="text-warning" style={{ width: '18px', height: '18px' }} />
                  <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>Sprint Planning — {selectedProject.name}</h5>
                </div>
                <button onClick={() => setIsSprintModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleSprintSubmit} className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Sprint Title</label>
                  <input
                    type="text"
                    required
                    value={sprintData.sprintName}
                    onChange={(e) => setSprintData({ ...sprintData, sprintName: e.target.value })}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-bold"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Sprint Deliverable Goal</label>
                  <textarea
                    rows={3}
                    required
                    value={sprintData.sprintGoal}
                    onChange={(e) => setSprintData({ ...sprintData, sprintGoal: e.target.value })}
                    className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm"
                  />
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Sprint Start Date</label>
                    <input
                      type="date"
                      required
                      value={sprintData.startDate}
                      onChange={(e) => setSprintData({ ...sprintData, startDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Sprint End Date</label>
                    <input
                      type="date"
                      required
                      value={sprintData.endDate}
                      onChange={(e) => setSprintData({ ...sprintData, endDate: e.target.value })}
                      className="form-control form-control-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsSprintModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 shadow-sm d-flex align-items-center gap-1.5"
                  >
                    <Zap style={{ width: '14px', height: '14px' }} />
                    <span>Launch & Plan Sprint</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Members Modal (PROJECT_MANAGER multiselect) */}
      {isAssignModalOpen && selectedProject && (
        <div className="modal fade show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient-primary text-white border-0 px-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <UserCheck className="text-white" style={{ width: '18px', height: '18px' }} />
                  <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1.5rem' }}>Assign Members — {selectedProject.name}</h5>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="btn-close btn-close-white shadow-none"></button>
              </div>

              <form onSubmit={handleAssignMembersSubmit} className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>Select Role to Assign</label>
                  <select
                    value={assignRoleCode}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setAssignRoleCode(nextRole);
                      const initialUserIds = getAlreadyAssignedUserIds(selectedProject, nextRole);
                      setSelectedUserIds(initialUserIds);

                      if (nextRole === 'DEVELOPER') {
                        const initialLeadMap: Record<number, number> = {};
                        selectedProject.members?.forEach(m => {
                          const r = m.projectRole?.toUpperCase() || '';
                          if ((r.includes('DEVELOPER') || r.includes('ROLE_DEVELOPER')) && m.lead && m.active) {
                            initialLeadMap[m.user.id] = m.lead.id;
                          }
                        });
                        setDeveloperLeadMap(initialLeadMap);
                      }
                    }}
                    className="form-select form-select-sm bg-light rounded-3 shadow-none text-sm fw-semibold"
                  >
                    <option value="PROJECT_LEAD">PROJECT LEAD</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-uppercase fw-bold text-muted small" style={{ fontSize: '0.7rem' }}>
                    Select Users ({selectedUserIds.length} Selected)
                  </label>
                  <div className="border rounded-3 p-2 bg-light overflow-auto animate-fade-in" style={{ maxHeight: '200px' }}>
                    {allUsers.filter(u => u.roles?.some(r => r === assignRoleCode || r === `ROLE_${assignRoleCode}`)).map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className={`d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 cursor-pointer transition-all ${
                            isSelected ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'bg-white border hover-bg-light'
                          }`}
                          style={{ fontSize: '0.8rem' }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="form-check-input mt-0"
                                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                              />
                              <span className="fw-semibold text-dark">
                                {u.firstName} {u.lastName} (@{u.username})
                              </span>
                            </div>

                            {/* Project Lead dropdown mapping */}
                            {isSelected && assignRoleCode === 'DEVELOPER' && (
                              <div className="d-flex align-items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-muted text-xs" style={{ fontSize: '0.65rem' }}>Lead:</span>
                                <select
                                  value={developerLeadMap[u.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDeveloperLeadMap(prev => ({
                                      ...prev,
                                      [u.id]: val ? Number(val) : 0
                                    }));
                                  }}
                                  className="form-select form-select-xs bg-white rounded-2 shadow-none py-0.5 text-xs text-dark"
                                  style={{ width: 'auto', minWidth: '120px', fontSize: '0.65rem', height: '22px' }}
                                >
                                  <option value="">Select Lead...</option>
                                  {(selectedProject.members || [])
                                    .filter(m => {
                                      const r = m.projectRole?.toUpperCase() || '';
                                      return (r.includes('PROJECT_LEAD') || r.includes('ROLE_PROJECT_LEAD')) && m.active;
                                    })
                                    .map(pl => (
                                      <option key={pl.user.id} value={pl.user.id}>
                                        {pl.user.firstName} {pl.user.lastName} (@{pl.user.username})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                          <span className="text-muted text-xs">{u.email}</span>
                        </div>
                      );
                    })}
                    {allUsers.filter(u => u.roles?.some(r => r === assignRoleCode || r === `ROLE_${assignRoleCode}`)).length === 0 && (
                      <div className="text-center text-muted small py-3 italic">
                        No registered users with {assignRoleCode.replace('_', ' ')} role.
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="btn btn-sm btn-light fw-semibold text-secondary px-3 rounded-3"
                  >
                    Cancel
                  </button>
                  {(() => {
                    const originallyAssigned = getAlreadyAssignedUserIds(selectedProject, assignRoleCode);
                    const toAdd = selectedUserIds.filter(id => !originallyAssigned.includes(id));
                    const toRemove = originallyAssigned.filter(id => !selectedUserIds.includes(id));

                    let btnText = 'Save Assignments';
                    if (assigning) {
                      btnText = 'Saving...';
                    } else if (toAdd.length > 0 && toRemove.length > 0) {
                      btnText = 'Update Assignments';
                    } else if (toRemove.length > 0 && toAdd.length === 0) {
                      btnText = 'Unassign Selected';
                    } else if (toAdd.length > 0 && toRemove.length === 0) {
                      btnText = 'Assign Selected';
                    }

                    return (
                      <button
                        type="submit"
                        disabled={assigning}
                        className="btn btn-sm btn-primary bg-gradient-primary border-0 fw-semibold text-white px-4 rounded-3 shadow-sm d-flex align-items-center gap-1.5"
                      >
                        <span>{btnText}</span>
                      </button>
                    );
                  })()}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
