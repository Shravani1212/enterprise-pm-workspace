import React from 'react';
import { Priority, TaskStatus, Label, ProjectMember } from '../types';
import { Filter, X, Search, ShieldAlert, Tag, User } from 'lucide-react';

export interface TaskFilterState {
  search: string;
  priorityId: string;
  statusId: string;
  assigneeId: string;
  labelId: string;
}

interface TaskFilterBarProps {
  filters: TaskFilterState;
  onFilterChange: (newFilters: TaskFilterState) => void;
  onResetFilters: () => void;
  priorities: Priority[];
  statuses: TaskStatus[];
  members: ProjectMember[];
  labels: Label[];
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  priorities,
  statuses,
  members,
  labels,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.priorityId !== '' ||
    filters.statusId !== '' ||
    filters.assigneeId !== '' ||
    filters.labelId !== '';

  const handleChange = (key: keyof TaskFilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 mb-6 flex flex-wrap items-center gap-3">
      {/* Title Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by keyword..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Priority Dropdown */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
        <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={filters.priorityId}
          onChange={(e) => handleChange('priorityId', e.target.value)}
          className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="">All Priorities</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id.toString()}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Dropdown */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={filters.statusId}
          onChange={(e) => handleChange('statusId', e.target.value)}
          className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id.toString()}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee Dropdown (Rule 8 filtered list) */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
        <User className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={filters.assigneeId}
          onChange={(e) => handleChange('assigneeId', e.target.value)}
          className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id.toString()}>
              {m.user.firstName} {m.user.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Tag/Label Dropdown */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
        <Tag className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={filters.labelId}
          onChange={(e) => handleChange('labelId', e.target.value)}
          className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="">All Labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id.toString()}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
