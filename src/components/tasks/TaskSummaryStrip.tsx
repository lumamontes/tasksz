/**
 * TaskSummaryStrip Component
 * Small, minimal summary strip with calendar info
 */

import type { Task } from '../../types';
import { parseDateLocal } from '../../utils/dateUtils';

interface TaskSummaryStripProps {
  task: Task;
}

export function TaskSummaryStrip({ task }: TaskSummaryStripProps) {
  if (!task.scheduledDate) {
    return null;
  }

  return (
    <div className="px-6 py-2 bg-theme-sidebar border-b border-theme-border flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-theme-muted">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="break-words">
          {parseDateLocal(task.scheduledDate).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}