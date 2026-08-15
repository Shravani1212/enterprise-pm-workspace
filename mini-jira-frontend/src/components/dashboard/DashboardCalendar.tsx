import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project } from '../../types';

interface DashboardCalendarProps {
  projects: Project[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  projects,
  selectedDate,
  onDateSelect,
}) => {
  const todayVal = new Date();
  const [currentYear, setCurrentYear] = useState(todayVal.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayVal.getMonth()); // 0-indexed

  const handlePrevMonth = () => {
    const minMonth = todayVal.getMonth();
    const minYear = todayVal.getFullYear();
    if (currentYear === minYear && currentMonth === minMonth) return;

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    const maxYear = todayVal.getFullYear();
    if (currentYear === maxYear && currentMonth === 11) return;

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className="card card-glass border-0 rounded-4 shadow-sm p-4 w-100 animate-fade-in">
      <h2 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
        <CalendarIcon style={{ width: '16px', height: '16px' }} className="text-primary" />
        <span>Project Events Calendar</span>
      </h2>

      {/* Month Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3 bg-light p-2 rounded-3 border">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={currentYear === todayVal.getFullYear() && currentMonth === todayVal.getMonth()}
          className="btn btn-xs btn-light border p-1 rounded-2 shadow-sm text-secondary hover-bg-white disabled-opacity-30"
        >
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
        </button>
        <span className="fw-bold text-dark text-xs text-uppercase" style={{ letterSpacing: '0.05em' }}>
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={currentYear === todayVal.getFullYear() && currentMonth === 11}
          className="btn btn-xs btn-light border p-1 rounded-2 shadow-sm text-secondary hover-bg-white disabled-opacity-30"
        >
          <ChevronRight style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Days of Week Headers */}
      <div className="d-grid gap-1 mb-2 text-center text-muted fw-bold" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '0.68rem' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="d-grid gap-1.5 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '0.75rem' }}>
        {(() => {
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

          const cells = [];
          for (let i = 0; i < firstDayIndex; i++) {
            cells.push(<div key={`empty-${i}`} className="p-1.5 opacity-0"></div>);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            const thisDate = new Date(currentYear, currentMonth, day);
            const isSelected = selectedDate.getDate() === day &&
                               selectedDate.getMonth() === currentMonth &&
                               selectedDate.getFullYear() === currentYear;
            const isToday = todayVal.getDate() === day &&
                            todayVal.getMonth() === currentMonth &&
                            todayVal.getFullYear() === currentYear;

            const dateStr = formatDateLocal(thisDate);
            const startsToday = projects.some((p) => p.startDate === dateStr);
            const endsToday = projects.some((p) => p.endDate === dateStr);

            cells.push(
              <div
                key={`day-${day}`}
                onClick={() => onDateSelect(thisDate)}
                className={`p-1.5 rounded-3 cursor-pointer transition-all d-flex flex-column align-items-center justify-content-center position-relative ${
                  isSelected 
                    ? 'bg-primary text-white shadow-sm fw-boldScale' 
                    : isToday 
                      ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-boldScale' 
                      : 'bg-white border hover-bg-light text-dark'
                }`}
                style={{ minHeight: '34px' }}
              >
                <span>{day}</span>
                <div className="position-absolute bottom-0 d-flex gap-1 mb-0.5 justify-content-center" style={{ width: '100%' }}>
                  {startsToday && (
                    <span className="rounded-circle bg-success" style={{ width: '4px', height: '4px' }}></span>
                  )}
                  {endsToday && (
                    <span className="rounded-circle bg-danger" style={{ width: '4px', height: '4px' }}></span>
                  )}
                </div>
              </div>
            );
          }

          return cells;
        })()}
      </div>
    </div>
  );
};
