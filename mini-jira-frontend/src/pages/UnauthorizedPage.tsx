import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ROUTES } from '../routes/appRoutes';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-vh-100 d-flex align-items-center justify-content-center ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="text-center">
        <div className="mb-4">
          <ShieldAlert size={64} className="text-danger mb-3" />
          <h1 className="display-4 fw-bold text-danger">403</h1>
        </div>
        <h2 className="h3 mb-3 fw-semibold">Access Denied</h2>
        <p className="text-muted mb-4 px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
          You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm d-inline-flex align-items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
