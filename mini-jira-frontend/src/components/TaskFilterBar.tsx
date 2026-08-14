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
    <div className="card card-glass p-3 mb-4 border-0 shadow-sm rounded-3">
      <div className="d-flex flex-wrap align-items-center gap-2">
        {/* Title Search Input */}
        <div className="input-group input-group-sm flex-grow-1" style={{ minWidth: '220px' }}>
          <span className="input-group-text bg-light border-end-0 text-muted">
            <Search style={{ width: '14px', height: '14px' }} />
          </span>
          <input
            type="text"
            placeholder="Filter by keyword..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="form-control bg-light border-start-0 shadow-none text-sm"
          />
        </div>

        {/* Priority Dropdown */}
        <div className="d-flex align-items-center bg-light border rounded-3 px-2 py-1" style={{ height: '34px' }}>
          <ShieldAlert className="text-muted me-1" style={{ width: '14px', height: '14px' }} />
          <select
            value={filters.priorityId}
            onChange={(e) => handleChange('priorityId', e.target.value)}
            className="form-select form-select-sm border-0 bg-transparent text-secondary fw-semibold shadow-none py-0 ps-1 pe-4"
            style={{ fontSize: '0.8rem', cursor: 'pointer' }}
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
        <div className="d-flex align-items-center bg-light border rounded-3 px-2 py-1" style={{ height: '34px' }}>
          <Filter className="text-muted me-1" style={{ width: '14px', height: '14px' }} />
          <select
            value={filters.statusId}
            onChange={(e) => handleChange('statusId', e.target.value)}
            className="form-select form-select-sm border-0 bg-transparent text-secondary fw-semibold shadow-none py-0 ps-1 pe-4"
            style={{ fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Dropdown */}
        <div className="d-flex align-items-center bg-light border rounded-3 px-2 py-1" style={{ height: '34px' }}>
          <User className="text-muted me-1" style={{ width: '14px', height: '14px' }} />
          <select
            value={filters.assigneeId}
            onChange={(e) => handleChange('assigneeId', e.target.value)}
            className="form-select form-select-sm border-0 bg-transparent text-secondary fw-semibold shadow-none py-0 ps-1 pe-4"
            style={{ fontSize: '0.8rem', cursor: 'pointer' }}
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
        <div className="d-flex align-items-center bg-light border rounded-3 px-2 py-1" style={{ height: '34px' }}>
          <Tag className="text-muted me-1" style={{ width: '14px', height: '14px' }} />
          <select
            value={filters.labelId}
            onChange={(e) => handleChange('labelId', e.target.value)}
            className="form-select form-select-sm border-0 bg-transparent text-secondary fw-semibold shadow-none py-0 ps-1 pe-4"
            style={{ fontSize: '0.8rem', cursor: 'pointer' }}
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
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 fw-bold rounded-3 ms-auto"
            style={{ fontSize: '0.78rem' }}
          >
            <X style={{ width: '14px', height: '14px' }} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
