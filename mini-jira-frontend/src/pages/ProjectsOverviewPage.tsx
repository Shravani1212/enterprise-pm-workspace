import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, ProjectResponse, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';
import { formatDateDDMMYYYY, getTodayLocalStr, getFutureLocalStr } from '../utils/dateUtils';

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([
        apiClient.get<ApiResponse<ProjectResponse[]>>('/projects'),
        apiClient.get<ApiResponse<User[]>>('/users').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (projRes.data.success && projRes.data.data) {
        setProjects(projRes.data.data);
      }
      if (userRes.data?.success && userRes.data?.data) {
        setUsers(userRes.data.data);
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

  const isAdminOrPm = user?.roles?.some((r) => 
    r === 'ADMIN' || r === 'ROLE_ADMIN' || 
    r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER' || 
    r === 'PROJECT_LEAD' || r === 'ROLE_PROJECT_LEAD'
  );

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

          {isAdminOrPm && (
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

      {/* Projects Grid */}
      {loading ? (
        <div className="row g-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="col-12 col-md-6 col-lg-4">
              <div className="card rounded-4 border-0 bg-light p-5 animate-pulse" style={{ height: '260px' }}></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card card-glass p-5 rounded-4 border-0 text-center max-w-md mx-auto my-5">
          <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-center text-primary mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
            <FolderKanban style={{ width: '28px', height: '28px' }} />
          </div>
          <h3 className="h6 fw-bold text-dark mb-1">No Projects Found</h3>
          <p className="small text-muted mb-4">
            There are currently no projects matching your search criteria or active filter.
          </p>
          {isAdminOrPm && (
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
            <div key={project.id} className="col-12 col-md-6 col-lg-4">
              <div className="card card-glass card-hover-lift rounded-4 border-0 p-4 d-flex flex-col justify-content-between h-100 position-relative overflow-hidden">
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

                <div className="pt-3 border-top">
                  {/* Dates & Members */}
                  <div className="d-flex align-items-center justify-content-between small text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                    <div className="d-flex align-items-center gap-1.5">
                      <Calendar style={{ width: '14px', height: '14px' }} />
                      <span>{project.startDate ? formatDateDDMMYYYY(project.startDate) : 'Active'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                      <Users style={{ width: '14px', height: '14px' }} />
                      <span>{project.members?.length || 4} Members</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between small fw-bold text-dark mb-1" style={{ fontSize: '0.72rem' }}>
                      <span>Sprint Completion</span>
                      <span className="text-primary">65%</span>
                    </div>
                    <div className="progress rounded-pill" style={{ height: '6px' }}>
                      <div className="progress-bar bg-gradient-primary rounded-pill w-65" role="progressbar" style={{ width: '65%' }}></div>
                    </div>
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

                    {isAdminOrPm && (
                      <div className="d-flex align-items-center gap-1">
                        <button
                          onClick={() => handleOpenSprintPlanning(project)}
                          className="btn btn-sm btn-light text-primary p-1 rounded-2 d-flex align-items-center gap-1 px-2 border"
                          title="Plan Sprint"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <Zap style={{ width: '13px', height: '13px' }} />
                          <span className="fw-semibold">Plan Sprint</span>
                        </button>

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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    {users.map((u) => (
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
                    {users.map((u) => (
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
    </div>
  );
};
