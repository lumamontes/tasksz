/**
 * CalendarMonthGrid Component
 * Month view calendar grid with task indicators
 * ND-safe: Clean, simple, no pressure
 */

import { $settings } from '../../stores/settingsStore';
import { useStore } from '@nanostores/react';
import { formatDateLocal, getTodayString, parseDateLocal } from '../../utils/dateUtils';
import { useState, useEffect, useRef } from 'react';
import { CalendarDayCell } from './CalendarDayCell';

interface CalendarMonthGridProps {
  year: number;
  month: number; // 0-11
  selectedDate: string | null; // YYYY-MM-DD
  onDateSelect: (dateStr: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarMonthGrid({ 
  year, 
  month, 
  selectedDate, 
  onDateSelect,
  onMonthChange 
}: CalendarMonthGridProps) {
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

  // Initialize focused date to selected date, today, or first day of month
  useEffect(() => {
    if (selectedDate) {
      const selected = parseDateLocal(selectedDate);
      if (selected.getFullYear() === year && selected.getMonth() === month) {
        setFocusedDate(selectedDate);
        return;
      }
    }
    
    const todayDate = new Date();
    if (todayDate.getFullYear() === year && todayDate.getMonth() === month) {
      setFocusedDate(todayStr);
    } else {
      setFocusedDate(formatDate(1));
    }
  }, [year, month, selectedDate, todayStr]);

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
        case 'PageUp':
          e.preventDefault();
          // Move to previous month
          if (onMonthChange) {
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            onMonthChange(prevYear, prevMonth);
          }
          return;
        case 'PageDown':
          e.preventDefault();
          // Move to next month
          if (onMonthChange) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            onMonthChange(nextYear, nextMonth);
          }
          return;
      }

      if (newDate) {
        const newYear = newDate.getFullYear();
        const newMonth = newDate.getMonth();
        
        // If moved to different month, trigger month change
        if (newYear !== year || newMonth !== month) {
          if (onMonthChange) {
            onMonthChange(newYear, newMonth);
          }
          // Set focused date after month changes
          setTimeout(() => {
            const newDateStr = formatDateLocal(newDate!);
            setFocusedDate(newDateStr);
            onDateSelect(newDateStr);
          }, 0);
        } else {
          // Keep within current month view
          const newDateStr = formatDateLocal(newDate);
          setFocusedDate(newDateStr);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedDate, year, month, daysInMonth, onDateSelect, onMonthChange]);

  // Generate calendar cells
  const calendarDays: Array<{ day: number | null; dateStr: string | null; isOutsideMonth: boolean }> = [];
  
  // Add days from previous month (for visual continuity)
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const daysToShowFromPrevMonth = startingDayOfWeek;
  for (let i = daysToShowFromPrevMonth - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    calendarDays.push({ 
      day, 
      dateStr: formatDateLocal(date),
      isOutsideMonth: true 
    });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ 
      day, 
      dateStr: formatDate(day),
      isOutsideMonth: false 
    });
  }
  
  // Add days from next month to fill the grid (6 rows = 42 cells)
  const totalCells = calendarDays.length;
  const remainingCells = 42 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    calendarDays.push({ 
      day, 
      dateStr: formatDateLocal(date),
      isOutsideMonth: true 
    });
  }

  return (
    <div className="flex flex-col min-h-0 flex-1" ref={gridRef} role="grid" aria-label={`Calendário de ${MONTHS[month]} ${year}`}>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4" role="row">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={`text-center font-medium text-theme-muted py-2 ${
              settings.fontScale === 'sm' ? 'text-xs' :
              settings.fontScale === 'lg' ? 'text-sm' :
              settings.fontScale === 'xl' ? 'text-base' :
              'text-xs'
            }`}
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr" role="rowgroup">
        {calendarDays.map((cell, index) => {
          if (cell.day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-16"
                aria-hidden="true"
              />
            );
          }

          const dateStr = cell.dateStr!;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const isFocused = focusedDate === dateStr;

          return (
            <CalendarDayCell
              key={dateStr}
              day={cell.day}
              dateStr={dateStr}
              isToday={isToday}
              isSelected={isSelected}
              isFocused={isFocused}
              isOutsideMonth={cell.isOutsideMonth}
              monthName={MONTHS[month]}
              year={year}
              onSelect={(date) => {
                setFocusedDate(date);
                onDateSelect(date);
              }}
              tabIndex={isFocused ? 0 : -1}
            />
          );
        })}
      </div>
    </div>
  );
}
