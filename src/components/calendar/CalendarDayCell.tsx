/**
 * CalendarDayCell Component
 * Individual day cell in the calendar grid
 * ND-safe: Simple, clear, no pressure indicators
 */

import { $settings } from '../../stores/settingsStore';
import { useStore } from '@nanostores/react';
import { getTaskCountForDate } from '../../stores/tasksStore';
import { getTodayString, parseDateLocal } from '../../utils/dateUtils';

interface CalendarDayCellProps {
  day: number;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isOutsideMonth: boolean;
  monthName: string;
  year: number;
  onSelect: (dateStr: string) => void;
  tabIndex?: number;
}

export function CalendarDayCell({
  day,
  dateStr,
  isToday,
  isSelected,
  isFocused,
  isOutsideMonth,
  monthName,
  year,
  onSelect,
  tabIndex = -1
}: CalendarDayCellProps) {
  const settings = useStore($settings);
  const taskCount = getTaskCountForDate(dateStr);
  const hasTasks = taskCount > 0;
  
  const transitionClass = settings.reduceMotion ? '' : 'transition-all duration-150';
  
  // Determine if weekend (subtle tinting)
  const date = parseDateLocal(dateStr);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  
  // Determine cell styling based on state
  let cellClasses = 'min-h-16 p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ';
  
  if (isSelected) {
    cellClasses += 'bg-theme-accent/20 border-theme-accent text-theme-text font-semibold ';
  } else if (isToday) {
    cellClasses += 'bg-theme-sidebar border-theme-accent/30 text-theme-text ';
  } else if (isFocused) {
    cellClasses += 'bg-theme-sidebar border-theme-border hover:border-theme-accent/50 text-theme-text ';
  } else {
    // Subtle weekend tinting (very subtle)
    if (isWeekend && !isOutsideMonth) {
      cellClasses += 'bg-theme-panel/95 border-theme-border hover:bg-theme-sidebar hover:border-theme-accent/30 text-theme-text ';
    } else {
      cellClasses += 'bg-theme-panel border-theme-border hover:bg-theme-sidebar hover:border-theme-accent/30 text-theme-text ';
    }
  }
  
  if (isOutsideMonth) {
    cellClasses += 'opacity-40 ';
  }
  
  cellClasses += transitionClass;

  // Build aria-label
  const ariaLabel = `${day} de ${monthName} ${year}${hasTasks ? `, ${taskCount} tarefa${taskCount !== 1 ? 's' : ''}` : ''}`;

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className={cellClasses}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      tabIndex={tabIndex}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {/* Day Number */}
        <span className={`${
          settings.fontScale === 'sm' ? 'text-xs' :
          settings.fontScale === 'lg' ? 'text-base' :
          settings.fontScale === 'xl' ? 'text-lg' :
          'text-sm'
        }`}>
          {day}
        </span>
        
        {/* Task Indicator - Visible badge */}
        {hasTasks && (
          <div className="mt-1 flex items-center justify-center">
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isSelected 
                  ? 'bg-theme-accent text-white' 
                  : 'bg-secondary-400 text-white'
              }`}
              aria-hidden="true"
            >
              {taskCount <= 9 ? taskCount : '9+'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
