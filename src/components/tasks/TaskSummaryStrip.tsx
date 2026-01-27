/**
 * TaskSummaryStrip Component
 * Small, minimal summary strip with progress, tags, and calendar info
 */

import { useStore } from '@nanostores/react';
import { $taskProgress } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import type { Task } from '../../types';
import { parseDateLocal } from '../../utils/dateUtils';

interface TaskSummaryStripProps {
  task: Task;
}

export function TaskSummaryStrip({ task }: TaskSummaryStripProps) {
  const progress = useStore($taskProgress);
  const settings = useStore($settings);
  
  const hasCalendar = !!task.scheduledDate || !!task.recurring;
  const hasProgress = settings.showProgressBars && progress.total > 0;
  
  // Don't show if nothing to display
  if (!hasProgress && !hasCalendar) {
    return null;
  }

  return (
    <div className="px-6 py-2 bg-theme-sidebar border-b border-theme-border flex items-center gap-4 text-xs text-theme-muted">
      {hasProgress && (
        <div className="flex items-center gap-2">
          <span>{progress.completed}/{progress.total}</span>
          {settings.showProgressBars && (
            <div className="w-16 h-1 bg-theme-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-theme-accent transition-all"
                style={{ 
                  width: `${progress.percentage}%`,
                  transitionDuration: settings.reduceMotion ? '0ms' : '300ms'
                }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      )}
      
      {hasCalendar && (
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {task.scheduledDate
              ? parseDateLocal(task.scheduledDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
              : task.recurring?.type === 'daily'
              ? 'Diária'
              : 'Semanal'}
          </span>
        </div>
      )}
    </div>
  );
}
