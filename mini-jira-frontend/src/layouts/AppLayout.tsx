import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FloatingAiAssistant } from '../components/ai/FloatingAiAssistant';
import { usePendingTasksNotifier } from '../hooks/usePendingTasksNotifier';

export const AppLayout: React.FC = () => {
  usePendingTasksNotifier();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex vh-100 overflow-hidden bg-workspace-gradient position-relative">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area with Header & Footer */}
      <div className="flex-grow-1 d-flex flex-column min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1 p-3 p-md-4 p-lg-5 overflow-auto" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Global Bottom Right Floating AI Assistant Widget */}
      <FloatingAiAssistant />
    </div>
  );
};
