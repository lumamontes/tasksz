/**
 * CalendarMonthGrid Component
 * Month view calendar grid with task indicators
 */

import { useStore } from '@nanostores/react';
import { $tasks, getTaskCountForDate } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { formatDateLocal, getTodayString, parseDateLocal } from '../../utils/dateUtils';
import { useState, useEffect, useRef } from 'react';

interface CalendarMonthGridProps {
  year: number;
  month: number; // 0-11
  selectedDate: string | null; // YYYY-MM-DD
  onDateSelect: (dateStr: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarMonthGrid({ year, month, selectedDate, onDateSelect }: CalendarMonthGridProps) {
  const tasks = useStore($tasks);
  const settings = useStore($settings);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Get today's date string
  const todayStr = getTodayString();

  // Format date to YYYY-MM-DD
  const formatDate = (day: number): string => {
    const date = new Date(year, month, day);
    return formatDateLocal(date);
  };

  // Initialize focused date to today or first day of month
  useEffect(() => {
    if (!focusedDate) {
      const todayDate = new Date();
      if (todayDate.getFullYear() === year && todayDate.getMonth() === month) {
        setFocusedDate(todayStr);
      } else {
        setFocusedDate(formatDate(1));
      }
    }
  }, [year, month]);

  // Keyboard navigation
  useEffect(() => {
    if (!focusedDate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const [y, m, d] = focusedDate.split('-').map(Number);
      const currentDate = new Date(y, m - 1, d);
      let newDate: Date | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          currentDate.setDate(currentDate.getDate() - 1);
          newDate = currentDate;
          break;
        case 'ArrowRight':
          e.preventDefault();
          currentDate.setDate(currentDate.getDate() + 1);
          newDate = currentDate;
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentDate.setDate(currentDate.getDate() - 7);
          newDate = currentDate;
          break;
        case 'ArrowDown':
          e.preventDefault();
          currentDate.setDate(currentDate.getDate() + 7);
          newDate = currentDate;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onDateSelect(focusedDate);
          return;
        case 'Home':
          e.preventDefault();
          newDate = new Date(year, month, 1);
          break;
        case 'End':
          e.preventDefault();
          newDate = new Date(year, month, daysInMonth);
          break;
      }

      if (newDate) {
        // Keep within current month view
        const newYear = newDate.getFullYear();
        const newMonth = newDate.getMonth();
        if (newYear === year && newMonth === month) {
          const newDateStr = formatDateLocal(newDate);
          setFocusedDate(newDateStr);
        } else {
          // If moved outside month, clamp to first or last day of month
          if (newYear < year || (newYear === year && newMonth < month)) {
            setFocusedDate(formatDate(1));
          } else {
            setFocusedDate(formatDate(daysInMonth));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedDate, year, month, daysInMonth, onDateSelect]);

  // Generate calendar cells
  const calendarDays: Array<{ day: number | null; dateStr: string | null }> = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push({ day: null, dateStr: null });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, dateStr: formatDate(day) });
  }

  return (
    <div className="h-full flex flex-col" ref={gridRef}>
      {/* Month/Year Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-theme-text">
          {MONTHS[month]} {year}
        </h2>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-theme-muted py-2"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((cell, index) => {
          if (cell.day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square"
                aria-hidden="true"
              />
            );
          }

          const dateStr = cell.dateStr!;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const isFocused = focusedDate === dateStr;
          const taskCount = getTaskCountForDate(dateStr);
          const hasTasks = taskCount > 0;

          return (
            <button
              key={dateStr}
              onClick={() => {
                setFocusedDate(dateStr);
                onDateSelect(dateStr);
              }}
              className={`
                aspect-square p-2 rounded-lg border-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2
                ${settings.reduceMotion ? '' : 'transition-all duration-150'}
                ${
                  isSelected
                    ? 'bg-theme-accent/20 border-theme-accent text-theme-text font-semibold'
                    : isToday
                    ? 'bg-theme-sidebar border-theme-accent/30 text-theme-text'
                    : isFocused
                    ? 'bg-theme-sidebar border-theme-border hover:border-theme-accent/50 text-theme-text'
                    : 'bg-theme-panel border-theme-border hover:bg-theme-sidebar hover:border-theme-accent/30 text-theme-text'
                }
              `}
              aria-label={`${cell.day} de ${MONTHS[month]} ${year}${hasTasks ? `, ${taskCount} tarefa${taskCount !== 1 ? 's' : ''}` : ''}`}
              aria-pressed={isSelected}
              tabIndex={isFocused ? 0 : -1}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-sm">{cell.day}</span>
                {hasTasks && (
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {taskCount <= 3 ? (
                      // Show individual dots for 1-3 tasks
                      Array.from({ length: taskCount }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-theme-accent' : 'bg-theme-muted'
                          }`}
                          aria-hidden="true"
                        />
                      ))
                    ) : (
                      // Show count for 4+ tasks
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? 'text-theme-accent' : 'text-theme-muted'
                        }`}
                        aria-hidden="true"
                      >
                        {taskCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
