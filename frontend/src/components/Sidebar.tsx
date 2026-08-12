import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { 
  FolderKanban, 
  LayoutDashboard, 
  GanttChartSquare, 
  Users, 
  Settings, 
  Bot, 
  LogOut, 
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { projectId } = useParams();
  const activeProjectId = projectId || '1';

  return (
    <aside className="w-64 glass-panel border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">Nexus PM</h1>
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
              Enterprise v1.0
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-6 space-y-1">
          <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Workspace</div>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Projects Overview</span>
          </NavLink>

          <NavLink
            to={`/projects/${activeProjectId}/board`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            }
          >
            <FolderKanban className="h-4 w-4" />
            <span>Kanban Board</span>
          </NavLink>

          <NavLink
            to={`/projects/${activeProjectId}/gantt`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            }
          >
            <GanttChartSquare className="h-4 w-4" />
            <span>Gantt Timeline</span>
          </NavLink>

          <NavLink
            to={`/projects/${activeProjectId}/members`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            }
          >
            <Users className="h-4 w-4" />
            <span>Project Members</span>
          </NavLink>

          <div className="pt-6 px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Intelligence & System</div>

          <NavLink
            to="/ai-assistant"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            }
          >
            <Bot className="h-4 w-4 text-sky-500 group-hover:text-sky-600" />
            <span>AI Assistant</span>
          </NavLink>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-200/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-slate-500 truncate">@{user?.username}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
