import React, { useState } from 'react';
import { Task } from '../../types';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
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

  const getPriorityColor = (code?: string) => {
    switch (code) {
      case 'CRITICAL': return '#rose-500';
      case 'HIGH': return '#amber-500';
      case 'MEDIUM': return '#3b82f6';
      default: return '#64748b';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900">Project Timeline & Gantt Chart</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Today
          </button>
          <button
            onClick={handlePrevWeek}
            className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="overflow-x-auto flex-1">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-600">
            {/* Task Name Column Header */}
            <div className="w-64 p-3 border-r border-slate-200 shrink-0">Task Name</div>

            {/* Date Columns */}
            <div className="flex-1 grid grid-cols-14">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 text-center border-r border-slate-200/60 ${
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ? 'bg-brand-50 text-brand-700 font-extrabold'
                      : ''
                  }`}
                >
                  <div className="text-[10px] uppercase text-slate-400">{format(day, 'EEE')}</div>
                  <div className="text-xs">{format(day, 'd MMM')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Rows */}
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              // Parse task start & end dates (fallback to today if unassigned)
              const taskStart = task.startDate ? new Date(task.startDate) : currentStartDate;
              const taskEnd = task.endDate ? new Date(task.endDate) : addDays(taskStart, 3);

              // Calculate start column offset & span length
              const startOffset = Math.max(0, differenceInDays(taskStart, days[0]));
              const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

              return (
                <div key={task.id} className="flex items-center hover:bg-slate-50/80 transition-colors group">
                  {/* Task Name Cell */}
                  <div
                    onClick={() => onTaskClick?.(task)}
                    className="w-64 p-3 border-r border-slate-200 shrink-0 cursor-pointer font-semibold text-xs text-slate-800 truncate group-hover:text-brand-600"
                  >
                    {task.title}
                  </div>

                  {/* Timeline Bar Cell Grid */}
                  <div className="flex-1 grid grid-cols-14 h-12 items-center relative px-1">
                    {startOffset < 14 && (
                      <div
                        style={{
                          gridColumnStart: startOffset + 1,
                          gridColumnEnd: `span ${Math.min(duration, 14 - startOffset)}`,
                        }}
                        className="h-7 rounded-lg bg-gradient-primary shadow-sm flex items-center justify-between px-2 text-white relative group/bar transition-all"
                      >
                        {/* Progress Fill Indicator */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-lg transition-all"
                          style={{ width: `${task.progressPercentage}%` }}
                        ></div>

                        {/* Title inside bar */}
                        <span className="text-[11px] font-bold truncate z-10 drop-shadow-sm">
                          {task.title}
                        </span>

                        {/* Assignee Avatar */}
                        {task.assignee ? (
                          <div className="h-5 w-5 rounded-full bg-white text-brand-600 font-extrabold text-[9px] flex items-center justify-center shrink-0 ml-1 z-10 shadow-xs">
                            {task.assignee.firstName[0]}
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-slate-300 text-slate-600 text-[9px] flex items-center justify-center shrink-0 ml-1 z-10">
                            <UserIcon className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
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
