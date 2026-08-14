import React, { useState } from 'react';
import { Task } from '../../types';
import { format, addDays, differenceInDays, startOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => startOfWeek(new Date()));

  // Calculate 16-day timeline window
  const days = useMemoDays(currentStartDate, 16);

  const handlePrevWeek = () => setCurrentStartDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentStartDate((prev) => addDays(prev, 7));
  const handleToday = () => setCurrentStartDate(startOfWeek(new Date()));

  return (
    <div className="bg-white border rounded-4 shadow-xs overflow-hidden d-flex flex-column">
      {/* Top Header Controls Bar */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
        <div className="d-flex align-items-center gap-2">
          <Calendar className="text-primary" style={{ width: '18px', height: '18px' }} />
          <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>Project Timeline & Gantt Chart</h3>
        </div>

        <div className="btn-group btn-group-sm shadow-xs">
          <button
            onClick={handleToday}
            className="btn btn-outline-secondary fw-semibold bg-white text-xs"
          >
            Today
          </button>
          <button
            onClick={handlePrevWeek}
            className="btn btn-outline-secondary bg-white text-xs"
          >
            <ChevronLeft style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={handleNextWeek}
            className="btn btn-outline-secondary bg-white text-xs"
          >
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Main Gantt Grid View */}
      <div className="overflow-auto flex-grow-1">
        <div style={{ minWidth: '1020px' }}>
          
          {/* Header Row matching Image 2 (TASK left, Date columns right) */}
          <div className="d-flex border-bottom bg-white text-muted fw-bold" style={{ fontSize: '0.74rem' }}>
            {/* Task Name Column Header */}
            <div className="p-3 border-end shrink-0 text-uppercase tracking-wider text-secondary" style={{ width: '280px', letterSpacing: '0.05em' }}>
              TASK
            </div>

            {/* Date Columns matching Image 2 (Date number on top, short month Aug below) */}
            <div className="flex-grow-1 d-grid" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
              {days.map((day, idx) => {
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div
                    key={idx}
                    className={`p-2 text-center border-end d-flex flex-column align-items-center justify-center ${
                      isToday ? 'bg-primary bg-opacity-10 text-primary fw-extrabold' : 'text-secondary'
                    }`}
                  >
                    <div className="fw-bold" style={{ fontSize: '0.78rem' }}>{format(day, 'd')}</div>
                    <div className="text-uppercase" style={{ fontSize: '0.62rem' }}>{format(day, 'MMM')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Timeline Rows matching Image 2 */}
          <div>
            {tasks.map((task) => {
              // Calculate completion progress percentage
              const subtasks = task.subtasks || [];
              const completedCount = subtasks.filter(s => s.completed).length;
              const totalSubtasks = subtasks.length || task.subtaskCount || 0;
              const progressPct = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : task.progressPercentage || 0;

              // Subtitle matching Image 2 (e.g. John Carter · In Progress · 1/4)
              const assigneeName = task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned';
              const statusName = task.status?.name || 'Backlog';
              const subtaskRatio = `${completedCount}/${totalSubtasks}`;
              const subtitleStr = `${assigneeName} · ${statusName} · ${subtaskRatio}`;

              // Parse task start & end dates (fallback to today window if not explicitly set)
              const taskStart = task.startDate ? new Date(task.startDate) : currentStartDate;
              const taskEnd = task.endDate ? new Date(task.endDate) : addDays(taskStart, 4);

              // Calculate start column offset & span length
              const startOffset = Math.max(0, differenceInDays(taskStart, days[0]));
              const duration = Math.max(2, differenceInDays(taskEnd, taskStart) + 1);

              return (
                <div key={task.id} className="d-flex align-items-center border-bottom hover-bg-light transition-all" style={{ height: '62px' }}>
                  
                  {/* Task Name & Subtitle Cell matching Image 2 */}
                  <div
                    onClick={() => onTaskClick?.(task)}
                    className="p-3 border-end shrink-0 cursor-pointer d-flex flex-column justify-center"
                    style={{ width: '280px' }}
                  >
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.86rem', lineHeight: '1.2' }}>
                      {task.title}
                    </div>
                    <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.72rem' }}>
                      {subtitleStr}
                    </div>
                  </div>

                  {/* Timeline Bar Cell Grid matching Image 2 */}
                  <div className="flex-grow-1 d-grid align-items-center position-relative px-2" style={{ gridTemplateColumns: 'repeat(16, 1fr)', height: '100%' }}>
                    {startOffset < 16 && (
                      <div
                        style={{
                          gridColumnStart: startOffset + 1,
                          gridColumnEnd: `span ${Math.min(duration, 16 - startOffset)}`,
                          height: '30px',
                          border: '1px solid #bfdbfe',
                          backgroundColor: '#eff6ff'
                        }}
                        className="rounded-pill shadow-xs gantt-bar-hover d-flex align-items-center justify-content-center text-dark position-relative overflow-hidden cursor-pointer"
                        onClick={() => onTaskClick?.(task)}
                        title={`${task.title} (${progressPct}% complete)`}
                      >
                        {/* Gradient Progress Fill Shading matching Image 2 cyan/blue bar */}
                        <div
                          className="position-absolute start-0 top-0 bottom-0 rounded-pill transition-all"
                          style={{
                            width: `${progressPct}%`,
                            background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)'
                          }}
                        ></div>

                        {/* Progress Percentage Text inside bar matching Image 2 */}
                        <span 
                          className="fw-bold position-relative z-1 text-xs" 
                          style={{ 
                            color: progressPct > 50 ? '#ffffff' : '#1e3a8a',
                            fontSize: '0.72rem' 
                          }}
                        >
                          {progressPct}%
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="p-5 text-center text-muted small">
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
