import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FloatingAiAssistant } from '../components/ai/FloatingAiAssistant';
import { usePendingTasksNotifier } from '../hooks/usePendingTasksNotifier';

export const AppLayout: React.FC = () => {
  usePendingTasksNotifier();

  return (
    <div className="d-flex min-vh-100 bg-workspace-gradient position-relative">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with Header & Footer */}
      <div className="flex-grow-1 d-flex flex-column min-w-0">
        <Navbar />
        <main className="flex-grow-1 p-3 p-md-4 p-lg-5 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Global Bottom Right Floating AI Assistant Widget */}
      <FloatingAiAssistant />
    </div>
  );
};
