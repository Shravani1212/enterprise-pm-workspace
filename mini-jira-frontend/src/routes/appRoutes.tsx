import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../layouts/AppLayout';

import { LoginPage } from '../pages/LoginPage';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';
import { GanttPage } from '../pages/GanttPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';
import { ProjectsOverviewPage } from '../pages/ProjectsOverviewPage';
import { ProjectMembersPage } from '../pages/ProjectMembersPage';
import { UserManagementPage } from '../pages/UserManagementPage';

import { DashboardPage } from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

// Centralized Route Path Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROJECTS: '/projects',
  KANBAN: (projectCode: string | number = ':projectCode') => `/projects/${projectCode}/board`,
  GANTT: (projectCode: string | number = ':projectCode') => `/projects/${projectCode}/gantt`,
  MEMBERS: (projectCode: string | number = ':projectCode') => `/projects/${projectCode}/members`,
  AI_ASSISTANT: (projectCode: string | number = ':projectCode') => `/projects/${projectCode}/ai-assistant`,
  UNAUTHORIZED: '/unauthorized',
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

export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  if (!isAdmin) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>

      <Route path={ROUTES.LOGIN} element={<LoginPage />} />


      <Route
        path={ROUTES.HOME}
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsOverviewPage />} />
        <Route path="projects/:projectCode/board" element={<KanbanBoardPage />} />
        <Route path="projects/:projectCode/gantt" element={<GanttPage />} />
        <Route path="projects/:projectCode/members" element={<ProjectMembersPage />} />
        <Route path="users" element={<AdminOnlyRoute><UserManagementPage /></AdminOnlyRoute>} />
        <Route path="projects/:projectCode/ai-assistant" element={<AiAssistantPage />} />
      </Route>

      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* Catch-all Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
