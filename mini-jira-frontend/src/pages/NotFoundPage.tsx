import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ROUTES } from '../routes/appRoutes';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-vh-100 d-flex align-items-center justify-content-center ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="text-center">
        <div className="mb-4">
          <Compass size={64} className="text-primary mb-3" />
          <h1 className="display-1 fw-bold text-primary">404</h1>
        </div>
        <h2 className="h3 mb-3 fw-semibold">Page Not Found</h2>
        <p className="text-muted mb-4 px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
          We couldn't find the page you're looking for. It might have been moved, deleted, or you may have mistyped the URL.
        </p>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm d-inline-flex align-items-center gap-2"
        >
          <Home size={20} />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
};
