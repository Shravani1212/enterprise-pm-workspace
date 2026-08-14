import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  FolderKanban, 
  LayoutDashboard, 
  GanttChartSquare, 
  Users, 
  LogOut, 
  User as UserIcon,
  ChevronUp,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './profile/ProfileModal';
import { showConfirmAlert } from '../utils/alertUtils';
import apiClient from '../services/apiClient';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projectId } = useParams();
  const location = useLocation();
  const [firstProjectId, setFirstProjectId] = useState<string>('1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get('/projects').then((res) => {
      if (res.data?.success && res.data?.data?.length > 0) {
        setFirstProjectId(String(res.data.data[0].id));
      }
    }).catch(() => {});
  }, []);

  const activeProjectId = projectId || firstProjectId;

  const handleLogoutClick = async () => {
    const confirmed = await showConfirmAlert(
      'Sign Out Workspace?',
      'Are you sure you want to log out of ProjectPulse?',
      'Log Out'
    );
    if (confirmed) {
      logout();
    }
  };

  return (
    <aside className="bg-white border-end d-flex flex-column justify-between vh-100 sticky-top z-3" style={{ width: '260px', flexShrink: 0 }}>
      <div>
        {/* Brand Header */}
        <div className="p-4 border-bottom d-flex align-items-center gap-3">
          <div className="rounded-3 bg-gradient-primary d-flex align-items-center justify-center text-white shadow-sm" style={{ width: '40px', height: '40px' }}>
            <Layers className="h-5 w-5" style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h1 className="h6 fw-bold mb-0 text-dark">ProjectPulse</h1>
            <span className="badge badge-subtle-primary rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>
              ProjectPulse v1.0
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className="px-2 mb-2 text-uppercase fw-bold text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            Workspace
          </div>

          <nav className="nav nav-pills flex-column gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-sm'
                    : 'text-secondary hover-bg-light'
                }`
              }
            >
              <LayoutDashboard style={{ width: '18px', height: '18px' }} />
              <span>Role Dashboard</span>
            </NavLink>

            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-sm'
                    : 'text-secondary hover-bg-light'
                }`
              }
            >
              <FolderKanban style={{ width: '18px', height: '18px' }} />
              <span>Projects & Sprints</span>
            </NavLink>

            <NavLink
              to={`/projects/${activeProjectId}/board`}
              className={({ isActive }) => {
                const isProjectViewActive = isActive || location.pathname.includes('/gantt');
                return `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-sm transition-all ${
                  isProjectViewActive
                    ? 'bg-gradient-primary text-white shadow-sm'
                    : 'text-secondary hover-bg-light'
                }`;
              }}
            >
              <Layers style={{ width: '18px', height: '18px' }} />
              <span>Project Workspace</span>
            </NavLink>

            <NavLink
              to={`/projects/${activeProjectId}/members`}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-sm'
                    : 'text-secondary hover-bg-light'
                }`
              }
            >
              <Users style={{ width: '18px', height: '18px' }} />
              <span>Project Members</span>
            </NavLink>

            {user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN') && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-primary text-white shadow-sm'
                      : 'text-secondary hover-bg-light'
                  }`
                }
              >
                <Users style={{ width: '18px', height: '18px' }} />
                <span>User & Roles Admin</span>
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      {/* User Footer with Options Menu */}
      <div className="p-3 border-top position-relative">
        {/* User Options Popover Menu */}
        {isMenuOpen && (
          <div
            className="position-absolute bg-white rounded-3 border shadow-lg overflow-hidden animate-slide-up p-2 z-3"
            style={{ bottom: '75px', left: '12px', right: '12px' }}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="btn btn-sm btn-light w-100 text-start d-flex align-items-center gap-2 px-3 py-2 fw-semibold text-dark rounded-2 mb-1"
            >
              <UserIcon className="text-primary" style={{ width: '16px', height: '16px' }} />
              <span className="small">Update Profile</span>
            </button>
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="btn btn-sm btn-light w-100 text-start d-flex align-items-center gap-2 px-3 py-2 fw-semibold text-dark rounded-2 mb-1"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="text-primary" style={{ width: '16px', height: '16px' }} />
                  <span className="small">Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun className="text-warning" style={{ width: '16px', height: '16px' }} />
                  <span className="small">Light Theme</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogoutClick();
              }}
              className="btn btn-sm btn-light w-100 text-start d-flex align-items-center gap-2 px-3 py-2 fw-semibold text-danger rounded-2"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              <span className="small">Sign Out</span>
            </button>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="d-flex align-items-center gap-2 overflow-hidden cursor-pointer flex-grow-1"
            style={{ cursor: 'pointer' }}
          >
            <div className="rounded-2 bg-gradient-primary text-white fw-bold d-flex align-items-center justify-center small shrink-0" style={{ width: '36px', height: '36px' }}>
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="text-truncate">
              <div className="fw-semibold text-dark text-truncate small">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>@{user?.username}</div>
            </div>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-sm btn-link text-muted p-1 border-0"
            title="Account Options"
          >
            <ChevronUp style={{ width: '16px', height: '16px', transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};
