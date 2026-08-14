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

// Admin Only Route Guard
export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsOverviewPage />} />
        <Route path="projects/:projectId/board" element={<KanbanBoardPage />} />
        <Route path="projects/:projectId/gantt" element={<GanttPage />} />
        <Route path="projects/:projectId/members" element={<ProjectMembersPage />} />
        <Route path="users" element={<AdminOnlyRoute><UserManagementPage /></AdminOnlyRoute>} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
      </Route>

      {/* Catch-all Fallback Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};
