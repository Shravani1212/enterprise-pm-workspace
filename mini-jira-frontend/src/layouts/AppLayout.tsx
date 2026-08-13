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
    <div className="flex min-h-screen bg-gradient-app relative">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with Header & Footer */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Global Bottom Right Floating AI Assistant Widget */}
      <FloatingAiAssistant />
    </div>
  );
};
