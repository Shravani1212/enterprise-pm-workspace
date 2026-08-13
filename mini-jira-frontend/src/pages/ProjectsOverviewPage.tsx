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
  CheckCircle2, 
  Clock, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse, ProjectResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';

export const ProjectsOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<ProjectResponse[]>>('/projects');
      if (res.data.success && res.data.data) {
        setProjects(res.data.data);
      }
    } catch (err: any) {
      // If error, keep empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const isAdminOrPm = user?.roles?.some((r) => r === 'ADMIN' || r === 'PROJECT_MANAGER');

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
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
    });
    setIsEditModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];

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
    try {
      const res = await apiClient.post<ApiResponse<ProjectResponse>>('/projects', formData);
      if (res.data.success) {
        showSuccessAlert('Project Created', `Project "${formData.name}" has been created successfully.`);
        setIsCreateModalOpen(false);
        fetchProjects();
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
    try {
      const res = await apiClient.put<ApiResponse<ProjectResponse>>(`/projects/${selectedProject.id}`, formData);
      if (res.data.success) {
        showSuccessAlert('Project Updated', `Project "${formData.name}" has been updated successfully.`);
        setIsEditModalOpen(false);
        fetchProjects();
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
        fetchProjects();
      } catch (err: any) {
        showErrorAlert('Delete Failed', err.response?.data?.error?.message || 'Failed to delete project.');
      }
    }
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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-200/80 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Projects</h1>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
              {filteredProjects.length} Active
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Centralized directory of workspace project tenants, engineering pipelines, and milestones.
          </p>
        </div>

        {isAdminOrPm && (
          <button
            onClick={handleOpenCreate}
            className="bg-gradient-primary hover:opacity-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all self-start md:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-200/60 rounded-xl text-xs font-semibold self-stretch sm:self-auto">
          {['ALL', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mx-auto mb-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Projects Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            There are currently no projects matching your search criteria or active filter.
          </p>
          {isAdminOrPm && (
            <button
              onClick={handleOpenCreate}
              className="bg-gradient-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md"
            >
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all group relative overflow-hidden"
            >
              {/* Top Card Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-primary"></div>

              <div>
                {/* Header Info */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                    {project.code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors mb-2 leading-snug">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-normal">
                  {project.description || 'Enterprise workspace tenant project with Kanban sprint tracking.'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Dates & Members */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Active'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{project.members?.length || 4} Members</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                    <span>Sprint Completion</span>
                    <span className="text-brand-600">65%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full w-[65%]"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => navigate(`/projects/${project.id}/board`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <span>Open Kanban Board</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {isAdminOrPm && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Project"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Create Enterprise Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus PM Platform"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    required
                    placeholder="NEXUS"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the scope and deliverables of this project..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    min={formData.startDate || todayStr}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-xl shadow-md"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Edit Project Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    min={formData.startDate || todayStr}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-xl shadow-md"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
