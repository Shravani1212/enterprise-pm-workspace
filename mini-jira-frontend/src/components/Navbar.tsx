import React from 'react';
import { Search, Bell, Sparkles, Plus, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  onNewTaskClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, searchValue, onNewTaskClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-sm z-3" style={{ height: '64px' }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Search Input Bar */}
        <div className="input-group" style={{ maxWidth: '380px' }}>
          <span className="input-group-text bg-light border-end-0 rounded-start-3 text-muted">
            <Search className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
          </span>
          <input
            type="text"
            placeholder="Search tasks, assignees, or labels..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="form-control form-control-sm bg-light border-start-0 rounded-end-3 text-sm shadow-none"
          />
        </div>

        {/* Action Bar */}
        <div className="d-flex align-items-center gap-3">
          {onNewTaskClick && (
            <button
              onClick={onNewTaskClick}
              className="btn btn-sm btn-primary bg-gradient-primary border-0 rounded-3 d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
              <span>New Task</span>
            </button>
          )}

          {/* Sun / Moon Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-light rounded-3 p-2 text-muted border-0 d-flex align-items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon style={{ width: '20px', height: '20px' }} />
            ) : (
              <Sun className="text-warning" style={{ width: '20px', height: '20px' }} />
            )}
          </button>

          <button className="btn btn-sm btn-light position-relative rounded-3 p-2 text-muted border-0">
            <Bell style={{ width: '20px', height: '20px' }} />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </button>

          <div className="vr bg-secondary opacity-25" style={{ height: '24px' }}></div>

          <div className="badge badge-subtle-warning d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-dark fw-bold" style={{ fontSize: '0.75rem' }}>
            <Sparkles className="text-warning fill-warning" style={{ width: '14px', height: '14px' }} />
            <span>Active Workspace</span>
          </div>
        </div>
      </div>
    </header>
  );
};
