/**
 * CalendarView Component
 * Calendar view for scheduling tasks and routines
 * Calm, visual time-awareness tool - not a rigid scheduling system
 */

import { useState, useEffect } from 'react';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarDayPanel } from './CalendarDayPanel';
import { getTodayString, parseDateLocal } from '../../utils/dateUtils';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Initialize selected date to today
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getTodayString());
    }
  }, []);

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Update current month/year if needed
    const date = parseDateLocal(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (year !== currentYear || month !== currentMonth) {
      setCurrentYear(year);
      setCurrentMonth(month);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = getTodayString();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-theme-panel overflow-hidden">
      {/* Month View - Left Side (Desktop) / Top (Mobile) */}
      <div className="lg:w-2/3 lg:border-r lg:border-theme-border p-6 lg:p-8 overflow-y-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Mês anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Próximo mês"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-theme-text bg-theme-sidebar hover:bg-theme-bg border border-theme-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
            aria-label="Ir para hoje"
          >
            Hoje
          </button>
        </div>

        <CalendarMonthGrid
          year={currentYear}
          month={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Day Panel - Right Side (Desktop) / Bottom (Mobile) */}
      <div className="lg:w-1/3 lg:border-l lg:border-theme-border">
        <CalendarDayPanel dateStr={selectedDate} />
      </div>
    </div>
  );
}