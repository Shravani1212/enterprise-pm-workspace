import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  Calendar, 
  Zap, 
  FileText,
  UserCheck,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { ApiResponse, Project, Task, User } from '../types';

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Automatic Role Detection (No Manual Toggle)
  const userRoles = currentUser?.roles || [];
  const isSystemAdmin = userRoles.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isProjectManager = userRoles.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER');

  const roleType = isSystemAdmin 
    ? 'ADMIN' 
    : isProjectManager 
    ? 'PROJECT_MANAGER' 
    : 'DEVELOPER';

  // Dynamic Data State
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const promises: [
        Promise<any>,
        Promise<any>,
        Promise<any>
      ] = [
        apiClient.get<ApiResponse<Project[]>>('/projects'),
        apiClient.get<ApiResponse<Task[]>>('/tasks').catch(() => ({ data: { success: false, data: [] } })),
        (isSystemAdmin || isProjectManager)
          ? apiClient.get<ApiResponse<User[]>>('/users').catch(() => ({ data: { success: false, data: [] } }))
          : Promise.resolve({ data: { success: false, data: [] } })
      ];

      const [projectsRes, tasksRes, usersRes] = await Promise.all(promises);

      const fetchedProjects = projectsRes.data?.success && projectsRes.data?.data ? projectsRes.data.data : [];
      setProjects(fetchedProjects);

      if (tasksRes.data?.success && tasksRes.data?.data) {
        setTasks(tasksRes.data.data);
      } else if (fetchedProjects.length > 0) {
        // Parallel fallback per project if /tasks fails
        const taskRequests = fetchedProjects.map((p: Project) =>
          apiClient.get<ApiResponse<Task[]>>(`/projects/${p.id}/tasks`).catch(() => null)
        );
        const taskResponses = await Promise.all(taskRequests);
        const aggregated = taskResponses.flatMap((res) => (res?.data?.success && res.data.data ? res.data.data : []));
        setTasks(aggregated);
      }

      if (usersRes.data?.success && usersRes.data?.data) {
        setUsers(usersRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dynamic dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dynamic role dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1240px' }}>
      {/* AUTOMATIC DASHBOARD RENDERING BASED STRICTLY ON USER ROLE */}
      {roleType === 'ADMIN' && (
        <AdminDynamicDashboard 
          currentUser={currentUser} 
          projects={projects} 
          tasks={tasks} 
          users={users} 
          navigate={navigate} 
        />
      )}

      {roleType === 'PROJECT_MANAGER' && (
        <ProjectManagerDynamicDashboard 
          currentUser={currentUser} 
          projects={projects} 
          tasks={tasks} 
          navigate={navigate} 
        />
      )}

      {roleType === 'DEVELOPER' && (
        <DeveloperDynamicDashboard 
          currentUser={currentUser} 
          projects={projects} 
          tasks={tasks} 
          navigate={navigate} 
        />
      )}
    </div>
  );
};

/* ============================================================================
   1. DYNAMIC ADMIN DASHBOARD VIEW
   ============================================================================ */
const AdminDynamicDashboard: React.FC<{
  currentUser: User | null;
  projects: Project[];
  tasks: Task[];
  users: User[];
  navigate: any;
}> = ({ currentUser, projects, tasks, users, navigate }) => {
  
  // Dynamic Calculations
  const totalUsersCount = users.length || 1;
  const activeUsersCount = users.filter(u => u.roles?.length).length || users.length;
  const totalProjectsCount = projects.length;
  const totalTasksCount = tasks.length;

  const adminCount = users.filter(u => u.roles?.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN')).length;
  const pmCount = users.filter(u => u.roles?.some(r => r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER')).length;
  const devCount = users.filter(u => u.roles?.some(r => r === 'DEVELOPER' || r === 'ROLE_DEVELOPER')).length;

  const adminPct = Math.round((adminCount / totalUsersCount) * 100) || 5;
  const pmPct = Math.round((pmCount / totalUsersCount) * 100) || 15;
  const devPct = Math.round((devCount / totalUsersCount) * 100) || 80;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Dynamic Header Banner */}
      <div className="card border-0 rounded-4 p-4 text-white bg-gradient-dark-header shadow-md position-relative overflow-hidden">
        <div className="d-flex align-items-center justify-content-between position-relative z-2">
          <div>
            <div className="badge bg-purple bg-opacity-20 text-white rounded-pill px-3 py-1 mb-2 font-monospace small">
              👑 SYSTEM ADMINISTRATOR PORTAL
            </div>
            <h2 className="h3 fw-bold text-white mb-1">
              Welcome back, Administrator {currentUser?.firstName || ''}!
            </h2>
            <p className="text-light text-opacity-80 small mb-0">
              System overview, user role management, service access control, and workspace metrics.
            </p>
          </div>
          <button 
            onClick={() => navigate('/users')}
            className="btn btn-light rounded-3 px-4 py-2.5 fw-semibold text-primary shadow-xs d-flex align-items-center gap-2 text-sm"
          >
            <UserCheck style={{ width: '18px', height: '18px' }} />
            <span>Manage System Users</span>
          </button>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Total Users</span>
              <div className="rounded-3 bg-indigo-600 bg-primary bg-opacity-10 text-primary p-2.5">
                <Users style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{totalUsersCount}</div>
            <div className="text-success fw-bold small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <TrendingUp style={{ width: '14px', height: '14px' }} />
              <span>Real-time database sync</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Total Projects</span>
              <div className="rounded-3 bg-purple bg-primary bg-opacity-10 text-purple p-2.5">
                <FolderKanban style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{totalProjectsCount}</div>
            <div className="text-success fw-bold small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <TrendingUp style={{ width: '14px', height: '14px' }} />
              <span>Active in workspace</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Total Tasks</span>
              <div className="rounded-3 bg-info bg-opacity-10 text-info p-2.5">
                <FileText style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{totalTasksCount}</div>
            <div className="text-success fw-bold small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <TrendingUp style={{ width: '14px', height: '14px' }} />
              <span>Across all projects</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Active Accounts</span>
              <div className="rounded-3 bg-success bg-opacity-10 text-success p-2.5">
                <UserCheck style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{activeUsersCount}</div>
            <div className="text-success fw-bold small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <TrendingUp style={{ width: '14px', height: '14px' }} />
              <span>100% system operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Middle Widgets */}
      <div className="row g-4">
        {/* Dynamic Users by Role Card */}
        <div className="col-12 col-lg-6">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">Users Distribution by System Role</h5>
              <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1 small">{totalUsersCount} Total</span>
            </div>

            <div className="d-flex flex-column gap-3.5 pt-2">
              <div>
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>💻 Developers ({devCount} users)</span>
                  <span className="text-muted">{devPct}%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: '8px' }}>
                  <div className="progress-bar bg-primary rounded-pill" style={{ width: `${devPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>📊 Project Managers ({pmCount} users)</span>
                  <span className="text-muted">{pmPct}%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: '8px' }}>
                  <div className="progress-bar bg-warning rounded-pill" style={{ width: `${pmPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                  <span>👑 Administrators ({adminCount} users)</span>
                  <span className="text-muted">{adminPct}%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: '8px' }}>
                  <div className="progress-bar bg-danger rounded-pill" style={{ width: `${adminPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Projects Summary Table */}
        <div className="col-12 col-lg-6">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">Active System Projects</h5>
              <button onClick={() => navigate('/projects')} className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0">
                View all ({projects.length})
              </button>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-light border cursor-pointer hover-scale" onClick={() => navigate('/projects')}>
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="font-monospace fw-bold text-primary small">[{p.code || p.id}]</span>
                    <span className="fw-bold text-dark small">{p.name}</span>
                  </div>
                  <span className="badge badge-subtle-success rounded-pill px-2.5 py-1 small">ACTIVE</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. DYNAMIC PROJECT MANAGER DASHBOARD VIEW
   ============================================================================ */
const ProjectManagerDynamicDashboard: React.FC<{
  currentUser: User | null;
  projects: Project[];
  tasks: Task[];
  navigate: any;
}> = ({ currentUser, projects, tasks, navigate }) => {

  // Dynamic PM Calculations
  const myProjectsCount = projects.length;
  
  const inProgressTasks = tasks.filter(t => 
    t.status?.code === 'IN_PROGRESS' || t.status?.name?.toLowerCase().includes('progress')
  );
  
  const completedTasks = tasks.filter(t => 
    t.status?.code === 'DONE' || t.status?.name?.toLowerCase().includes('done')
  );

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const isPastDue = new Date(t.dueDate) < new Date();
    const isNotDone = t.status?.code !== 'DONE';
    return isPastDue && isNotDone;
  });

  // Calculate completion percentage for each project dynamically
  const projectProgressList = projects.slice(0, 4).map(p => {
    const projTasks = tasks.filter(t => t.projectId === p.id);
    const doneTasks = projTasks.filter(t => t.status?.code === 'DONE').length;
    const pct = projTasks.length === 0 ? 0 : Math.round((doneTasks / projTasks.length) * 100);
    return { ...p, progressPct: pct, taskCount: projTasks.length };
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* Welcome Header */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm border-start border-success border-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              Welcome back, {currentUser?.firstName || 'Project Manager'}! 👋
            </h2>
            <p className="text-muted small mb-0">Here's what's happening with your project portfolio today.</p>
          </div>
          <button 
            onClick={() => navigate('/projects')}
            className="btn btn-success bg-gradient-success border-0 text-white rounded-3 px-4 py-2.5 fw-semibold shadow-xs d-flex align-items-center gap-2 text-sm"
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>My Projects</span>
              <div className="rounded-3 bg-success bg-opacity-10 text-success p-2.5">
                <FolderKanban style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{myProjectsCount}</div>
            <div className="text-success fw-bold small" style={{ fontSize: '0.75rem' }}>Active workspace</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Tasks In Progress</span>
              <div className="rounded-3 bg-warning bg-opacity-10 text-warning p-2.5">
                <Clock style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{inProgressTasks.length}</div>
            <div className="text-primary fw-bold small" style={{ fontSize: '0.75rem' }}>Active engineering tasks</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Tasks Completed</span>
              <div className="rounded-3 bg-info bg-opacity-10 text-info p-2.5">
                <CheckCircle2 style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{completedTasks.length}</div>
            <div className="text-success fw-bold small" style={{ fontSize: '0.75rem' }}>Completed deliverables</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white border-start border-danger border-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Overdue Tasks</span>
              <div className="rounded-3 bg-danger bg-opacity-10 text-danger p-2.5">
                <AlertCircle style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-danger mb-1">{overdueTasks.length}</div>
            <div className="text-danger fw-bold small" style={{ fontSize: '0.75rem' }}>🚨 Delay reason tracking active</div>
          </div>
        </div>
      </div>

      {/* Dynamic Projects Progress & Deadlines */}
      <div className="row g-4">
        {/* Real Projects Completion Progress Bars */}
        <div className="col-12 col-lg-7">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">Project Progress Overview</h5>
              <button onClick={() => navigate('/projects')} className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0">
                View all projects ({projects.length})
              </button>
            </div>

            <div className="d-flex flex-column gap-3.5 pt-1">
              {projectProgressList.map(p => (
                <div key={p.id}>
                  <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                    <span>{p.name}</span>
                    <span className="text-success fw-bold">{p.progressPct}% ({p.taskCount} tasks)</span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: '8px' }}>
                    <div className="progress-bar bg-success rounded-pill" style={{ width: `${Math.max(p.progressPct, 5)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Tasks / Deadlines List */}
        <div className="col-12 col-lg-5">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">Active Sprint Tasks</h5>
              <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1 small">{tasks.length} Total</span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 bg-light border">
                  <div>
                    <div className="fw-bold text-dark small">{t.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Assignee: {t.assignee?.firstName || 'Unassigned'}
                    </div>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary border px-2.5 py-1 small">
                    {t.status?.name || 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. DYNAMIC DEVELOPER DASHBOARD VIEW
   ============================================================================ */
const DeveloperDynamicDashboard: React.FC<{
  currentUser: User | null;
  projects: Project[];
  tasks: Task[];
  navigate: any;
}> = ({ currentUser, projects, tasks, navigate }) => {

  // Dynamic Developer Calculations
  // Filter tasks assigned to current user
  const myAssignedTasks = tasks.filter(t => t.assignee?.id === currentUser?.id || t.assignee?.username === currentUser?.username);
  
  const inProgress = myAssignedTasks.filter(t => t.status?.code === 'IN_PROGRESS' || t.status?.name?.toLowerCase().includes('progress')).length;
  const completed = myAssignedTasks.filter(t => t.status?.code === 'DONE' || t.status?.name?.toLowerCase().includes('done')).length;
  
  const loggedHours = myAssignedTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Welcome Header */}
      <div className="card card-glass p-4 rounded-4 border-0 shadow-sm border-start border-primary border-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              Good morning, Developer {currentUser?.firstName || ''}! ☕
            </h2>
            <p className="text-muted small mb-0">Here is your live assigned task queue and active coding items.</p>
          </div>
          <button 
            onClick={() => navigate('/projects/1/board')}
            className="btn btn-primary text-white rounded-3 px-4 py-2.5 fw-semibold shadow-xs d-flex align-items-center gap-2 text-sm"
          >
            <FolderKanban style={{ width: '18px', height: '18px' }} />
            <span>Go to Kanban Board</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metrics */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>My Assigned Tasks</span>
              <div className="rounded-3 bg-info bg-opacity-10 text-info p-2.5">
                <FileText style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{myAssignedTasks.length}</div>
            <div className="text-primary fw-bold small" style={{ fontSize: '0.75rem' }}>Assigned to you</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>In Progress</span>
              <div className="rounded-3 bg-warning bg-opacity-10 text-warning p-2.5">
                <Clock style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{inProgress}</div>
            <div className="text-warning fw-bold small" style={{ fontSize: '0.75rem' }}>Active coding</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Completed</span>
              <div className="rounded-3 bg-success bg-opacity-10 text-success p-2.5">
                <CheckCircle2 style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{completed}</div>
            <div className="text-success fw-bold small" style={{ fontSize: '0.75rem' }}>Finished items</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card card-hover-lift border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted small uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Logged Hours</span>
              <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-2.5">
                <Zap style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
            <div className="h2 fw-bold text-dark mb-1">{loggedHours}h</div>
            <div className="text-primary fw-bold small" style={{ fontSize: '0.75rem' }}>Total time logged</div>
          </div>
        </div>
      </div>

      {/* Dynamic Assigned Tasks Table */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">My Assigned Tasks</h5>
              <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1 small">{myAssignedTasks.length} Assigned</span>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th>Task Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Hours Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssignedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted small">No tasks currently assigned. Select a project from the left menu to view tasks.</td>
                    </tr>
                  ) : (
                    myAssignedTasks.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="fw-bold text-dark small py-3">{t.title}</td>
                        <td>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 small">
                            {t.priority?.name || 'MEDIUM'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-0.5 small">
                            {t.status?.name || 'IN_PROGRESS'}
                          </span>
                        </td>
                        <td className="text-muted small">{t.loggedHours || 0}h</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dynamic Assigned Projects List */}
        <div className="col-12 col-lg-4">
          <div className="card card-glass border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="h6 fw-bold text-dark mb-0">My Projects</h5>
              <span className="badge badge-subtle-success rounded-pill px-2.5 py-1 small">{projects.length} Projects</span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {projects.map(p => (
                <div key={p.id} className="p-3 rounded-3 bg-light border cursor-pointer hover-scale" onClick={() => navigate('/projects/1/board')}>
                  <div className="fw-bold text-dark small">{p.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Role: Developer</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
