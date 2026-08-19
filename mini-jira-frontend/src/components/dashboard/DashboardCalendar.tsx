import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Project } from '../../types';

import './DashboardCalendar.css';

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

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  //tells extra events for dated
  const tileContent = ({ date, view }: { date: Date; view: string }) => {

    if (view === 'month') {
      const dateStr = formatDateLocal(date);
      const startsToday = projects.some((p) => p.startDate === dateStr);
      const endsToday = projects.some((p) => p.endDate === dateStr);

      if (startsToday || endsToday) {
        return (
          <div className="d-flex justify-content-center gap-1 mt-1" style={{ height: '6px' }}>
            {startsToday && (
              <span className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></span>
            )}
            {endsToday && (
              <span className="bg-danger rounded-circle" style={{ width: '6px', height: '6px' }}></span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="card card-glass border-0 rounded-4 shadow-sm p-4 w-100 animate-fade-in custom-calendar-wrapper">
      <h2 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
        <CalendarIcon style={{ width: '16px', height: '16px' }} className="text-primary" />
        <span>Project Events Calendar</span>
      </h2>

      <Calendar
        onChange={(val) => onDateSelect(val as Date)}
        value={selectedDate}
        tileContent={tileContent}
        className="w-100 border-0 shadow-none bg-transparent"
        prev2Label={null}
        next2Label={null}
      />
    </div>
  );
};
