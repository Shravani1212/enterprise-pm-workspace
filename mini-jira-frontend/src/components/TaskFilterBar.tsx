import React from 'react';
import { Priority, TaskStatus, Label, ProjectMember } from '../types';
import { Search, X } from 'lucide-react';

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
    <div className="bg-white p-2.5 mb-4 rounded-4 border shadow-xs">
      <div className="d-flex flex-wrap align-items-center gap-2.5">
        {/* Title Search Input matching exact Image mock */}
        <div className="input-group flex-grow-1" style={{ minWidth: '280px' }}>
          <span className="input-group-text bg-light border-end-0 rounded-start-4 px-3 text-muted">
            <Search style={{ width: '16px', height: '16px' }} />
          </span>
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="form-control bg-light border-start-0 rounded-end-4 shadow-none text-sm py-2"
          />
        </div>

        <div className="bg-light border rounded-4 px-3 py-1.5" style={{ minWidth: '150px' }}>
          <select
            value={filters.priorityId}
            onChange={(e) => handleChange('priorityId', e.target.value)}
            className="form-select border-0 bg-transparent text-dark fw-medium shadow-none py-1 ps-0 pe-4 text-xs"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All priorities</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-light border rounded-4 px-3 py-1.5" style={{ minWidth: '150px' }}>
          <select
            value={filters.assigneeId}
            onChange={(e) => handleChange('assigneeId', e.target.value)}
            className="form-select border-0 bg-transparent text-dark fw-medium shadow-none py-1 ps-0 pe-4 text-xs"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All assignees</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id.toString()}>
                {m.user.firstName} {m.user.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-light border rounded-4 px-3 py-1.5" style={{ minWidth: '140px' }}>
          <select
            value={filters.statusId}
            onChange={(e) => handleChange('statusId', e.target.value)}
            className="form-select border-0 bg-transparent text-dark fw-medium shadow-none py-1 ps-0 pe-4 text-xs"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5 fw-semibold rounded-pill px-3 py-1.5 text-xs ms-auto"
          >
            <X style={{ width: '14px', height: '14px' }} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
