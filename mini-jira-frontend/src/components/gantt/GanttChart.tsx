import React, { useState } from 'react';
import { Task } from '../../types';
import { format, addDays, differenceInDays, startOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => startOfWeek(new Date()));

  // Calculate 14-day timeline window
  const days = useMemoDays(currentStartDate, 14);

  const handlePrevWeek = () => setCurrentStartDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentStartDate((prev) => addDays(prev, 7));
  const handleToday = () => setCurrentStartDate(startOfWeek(new Date()));

  return (
    <div className="card card-glass border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column">
      {/* Controls Bar */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
        <div className="d-flex align-items-center gap-2">
          <Calendar className="text-primary" style={{ width: '18px', height: '18px' }} />
          <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>Project Timeline & Gantt Chart</h3>
        </div>

        <div className="btn-group btn-group-sm shadow-xs">
          <button
            onClick={handleToday}
            className="btn btn-outline-secondary fw-semibold bg-white"
          >
            Today
          </button>
          <button
            onClick={handlePrevWeek}
            className="btn btn-outline-secondary bg-white"
          >
            <ChevronLeft style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={handleNextWeek}
            className="btn btn-outline-secondary bg-white"
          >
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="overflow-auto flex-grow-1">
        <div style={{ minWidth: '920px' }}>
          {/* Header Row */}
          <div className="d-flex border-bottom bg-light text-muted small fw-bold" style={{ fontSize: '0.78rem' }}>
            {/* Task Name Column Header */}
            <div className="p-3 border-end shrink-0" style={{ width: '260px' }}>Task Name</div>

            {/* Date Columns */}
            <div className="flex-grow-1 d-grid" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 text-center border-end ${
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ? 'bg-primary bg-opacity-10 text-primary fw-extrabold'
                      : ''
                  }`}
                >
                  <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>{format(day, 'EEE')}</div>
                  <div style={{ fontSize: '0.75rem' }}>{format(day, 'd MMM')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Rows */}
          <div className="divide-y">
            {tasks.map((task) => {
              // Parse task start & end dates (fallback to today if unassigned)
              const taskStart = task.startDate ? new Date(task.startDate) : currentStartDate;
              const taskEnd = task.endDate ? new Date(task.endDate) : addDays(taskStart, 3);

              // Calculate start column offset & span length
              const startOffset = Math.max(0, differenceInDays(taskStart, days[0]));
              const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

              return (
                <div key={task.id} className="d-flex align-items-center border-bottom hover-bg-light transition-all">
                  {/* Task Name Cell */}
                  <div
                    onClick={() => onTaskClick?.(task)}
                    className="p-3 border-end shrink-0 cursor-pointer fw-semibold text-truncate text-dark"
                    style={{ width: '260px', fontSize: '0.8rem' }}
                  >
                    {task.title}
                  </div>

                  {/* Timeline Bar Cell Grid */}
                  <div className="flex-grow-1 d-grid align-items-center position-relative px-1" style={{ gridTemplateColumns: 'repeat(14, 1fr)', height: '48px' }}>
                    {startOffset < 14 && (
                      <div
                        style={{
                          gridColumnStart: startOffset + 1,
                          gridColumnEnd: `span ${Math.min(duration, 14 - startOffset)}`,
                          height: '28px',
                        }}
                        className="rounded-3 bg-gradient-primary shadow-xs d-flex align-items-center justify-content-between px-2 text-white position-relative overflow-hidden"
                      >
                        {/* Progress Fill Indicator */}
                        <div
                          className="position-absolute start-0 top-0 bottom-0 bg-white bg-opacity-25 rounded-3"
                          style={{ width: `${task.progressPercentage}%` }}
                        ></div>

                        {/* Title inside bar */}
                        <span className="fw-bold text-truncate position-relative z-1 text-white" style={{ fontSize: '0.72rem' }}>
                          {task.title}
                        </span>

                        {/* Assignee Avatar */}
                        {task.assignee ? (
                          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-center ms-1 position-relative z-1 shadow-xs" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                            {task.assignee.firstName[0]}
                          </div>
                        ) : (
                          <div className="rounded-circle bg-secondary bg-opacity-50 text-white d-flex align-items-center justify-center ms-1 position-relative z-1" style={{ width: '20px', height: '20px' }}>
                            <UserIcon style={{ width: '10px', height: '10px' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="p-4 text-center text-muted small">
                No tasks available for timeline visualization.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function useMemoDays(startDate: Date, count: number): Date[] {
  return React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => addDays(startDate, i));
  }, [startDate, count]);
}
