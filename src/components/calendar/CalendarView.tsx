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
import { ResizableHandle } from '../ui/ResizableHandle';
import { useResizablePanels } from '../../hooks/useResizablePanels';
import { $settings } from '../../stores/settingsStore';
import { getTodayString, parseDateLocal } from '../../utils/dateUtils';

const LAST_SELECTED_CALENDAR_DATE_KEY = 'lastSelectedCalendarDate';

export function CalendarView() {
  const settings = useStore($settings);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [isMobileView, setIsMobileView] = useState(false);

  // Resizable panels for desktop view
  const {
    leftPanelWidth,
    isResizing,
    containerRef,
    startResize,
    handleKeyDown
  } = useResizablePanels({
    defaultLeftWidth: 700,
    minLeftWidth: 600,
    maxLeftWidth: 900,
    storageKey: 'calendar-panels-width'
  });

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

  // Detect mobile view - use smaller breakpoint for better two-panel experience
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const shouldBeMobile = width < 768;
      setIsMobileView(shouldBeMobile);
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
  const paddingClass = settings.density === 'compact' ? 'p-4' : 'p-6';

  // Mobile view: single column
  if (isMobileView) {
    return (
      <div 
        data-section="calendar" 
        className={`h-full flex flex-col bg-theme-panel overflow-hidden ${transitionClass}`}
      >
        <div className={`${paddingClass} overflow-y-auto`}>
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

        {/* Mobile Day Panel - Show when date selected */}
        {selectedDate && (
          <div className="border-t border-theme-border bg-theme-sidebar">
            <CalendarDayPanel dateStr={selectedDate} />
          </div>
        )}
      </div>
    );
  }

  // Desktop view: resizable two-panel layout
  return (
    <div 
      ref={containerRef}
      data-section="calendar" 
      className={`h-full flex bg-theme-panel overflow-hidden ${transitionClass}`}
    >
      {/* Calendar Panel - Left Side (Resizable) */}
      <div 
        style={{ width: `${leftPanelWidth}px` }}
        className={`shrink-0 flex flex-col bg-theme-panel border-r border-theme-border`}
      >
        <div className={`${paddingClass} shrink-0`}>
          <CalendarHeader
            year={currentYear}
            month={currentMonth}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
        </div>
        
        <div className={`flex-1 min-h-0 ${paddingClass} pt-0`}>
          <CalendarMonthGrid
            year={currentYear}
            month={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>

      {/* Resizable Handle */}
      <ResizableHandle
        onMouseDown={startResize}
        onKeyDown={handleKeyDown}
        isResizing={isResizing}
      />

      {/* Day Details Panel - Right Side */}
      <div className="flex-1 min-w-0 bg-theme-sidebar">
        <CalendarDayPanel dateStr={selectedDate} />
      </div>
    </div>
  );
}