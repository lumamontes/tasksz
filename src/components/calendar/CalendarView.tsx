/**
 * CalendarView Component
 * Calendar view for scheduling tasks and routines
 * Calm, visual time-awareness tool - not a rigid scheduling system
 * ND-safe: No pressure, clear navigation, optional features
 */

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { CalendarHeader } from './CalendarHeader';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarDayPanel } from './CalendarDayPanel';
import { $settings } from '../../stores/settingsStore';
import { getTodayString, parseDateLocal } from '../../utils/dateUtils';

const LAST_SELECTED_CALENDAR_DATE_KEY = 'lastSelectedCalendarDate';

export function CalendarView() {
  const settings = useStore($settings);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [isMobileView, setIsMobileView] = useState(false);

  // Initialize selected date from localStorage or today
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedDate = localStorage.getItem(LAST_SELECTED_CALENDAR_DATE_KEY);
    if (savedDate) {
      try {
        const date = parseDateLocal(savedDate);
        // Validate the date is reasonable (not too far in past/future)
        const now = new Date();
        const yearDiff = Math.abs(date.getFullYear() - now.getFullYear());
        if (yearDiff <= 1) {
          setSelectedDate(savedDate);
          setCurrentYear(date.getFullYear());
          setCurrentMonth(date.getMonth());
          return;
        }
      } catch (e) {
        // Invalid date, fall through to today
      }
    }
    
    // Default to today
    const todayStr = getTodayString();
    setSelectedDate(todayStr);
  }, []);

  // Persist selected date to localStorage
  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem(LAST_SELECTED_CALENDAR_DATE_KEY, selectedDate);
    }
  }, [selectedDate]);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const transitionClass = settings.reduceMotion ? '' : 'transition-all duration-300';
  const paddingClass = settings.density === 'compact' ? 'p-4 lg:p-6' : 'p-6 lg:p-8';

  return (
    <div 
      data-section="calendar" 
      className={`h-full flex flex-col lg:flex-row bg-theme-panel overflow-hidden ${transitionClass}`}
    >
      {/* Month View - Left Side (Desktop) / Full (Mobile) */}
      <div className={`lg:w-2/3 lg:border-r lg:border-theme-border ${paddingClass} overflow-y-auto`}>
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
        
        <CalendarMonthGrid
          year={currentYear}
          month={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Day Panel - Right Side (Desktop) / Hidden on Mobile (shown via modal/slide) */}
      <div className={`lg:w-1/3 lg:border-l lg:border-theme-border ${
        isMobileView && selectedDate ? 'hidden' : ''
      }`}>
        <CalendarDayPanel dateStr={selectedDate} />
      </div>
    </div>
  );
}