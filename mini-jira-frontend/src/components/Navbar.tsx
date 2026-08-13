import React from 'react';
import { Search, Bell, Sparkles, Plus } from 'lucide-react';

interface NavbarProps {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  onNewTaskClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, searchValue, onNewTaskClick }) => {
  return (
    <header className="h-16 glass-panel border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Bar */}
      <div className="relative w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks, assignees, or labels..."
          value={searchValue || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4">
        {onNewTaskClick && (
          <button
            onClick={onNewTaskClick}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-95 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        )}

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-700">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Active Workspace</span>
        </div>
      </div>
    </header>
  );
};
