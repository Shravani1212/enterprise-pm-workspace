import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gradient-app">
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
    </div>
  );
};
