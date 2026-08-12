import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../layouts/AppLayout';

import { LoginPage } from '../pages/LoginPage';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';
import { GanttPage } from '../pages/GanttPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';

// Centralized Route Path Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROJECTS: '/projects',
  KANBAN: (projectId: string | number = ':projectId') => `/projects/${projectId}/board`,
  GANTT: (projectId: string | number = ':projectId') => `/projects/${projectId}/gantt`,
  MEMBERS: (projectId: string | number = ':projectId') => `/projects/${projectId}/members`,
  AI_ASSISTANT: '/ai-assistant',
};

// Reusable Protected Route Wrapper Guard
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Placeholder Page for secondary subviews
const PlaceholderPage: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="glass-card p-8 rounded-2xl border border-slate-200">
    <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
    <p className="text-sm text-slate-500">{description || 'Component view ready for integration.'}</p>
  </div>
);

// Master App Routes Component
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Protected Routes Wrapped with Layout (Header, Sidebar, Footer) */}
      <Route
        path={ROUTES.HOME}
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.PROJECTS} replace />} />
        <Route
          path="projects"
          element={
            <PlaceholderPage
              title="Projects Directory"
              description="Overview of active enterprise workspace project tenants."
            />
          }
        />
        <Route path="projects/:projectId/board" element={<KanbanBoardPage />} />
        <Route path="projects/:projectId/gantt" element={<GanttPage />} />
        <Route
          path="projects/:projectId/members"
          element={
            <PlaceholderPage
              title="Project Members & Access Control"
              description="Manage team membership and project-level RBAC role assignments."
            />
          }
        />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
      </Route>

      {/* Catch-all Fallback Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};
