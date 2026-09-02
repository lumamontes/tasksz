/**
 * CalendarSection Component
 * Simple optional date association for a task: pick a date or remove it.
 */

import { useState } from 'react';
import { updateTask } from '../../stores/tasksStore';
import type { Task } from '../../types';

interface CalendarSectionProps {
  task: Task;
}

export function CalendarSection({ task }: CalendarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!!task.scheduledDate);
  const hasDate = !!task.scheduledDate;

  if (!isExpanded) {
    return (
      <div className="mx-6 mb-6">
        <button
          onClick={() => setIsExpanded(true)}
          aria-expanded={false}
          className="w-full text-left px-4 py-2 text-sm text-theme-muted hover:text-theme-accent hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
        >
          + Adicionar ao calendário
        </button>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-6">
      <button
        onClick={() => setIsExpanded(false)}
        aria-expanded={true}
        className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
      >
        <span>Data</span>
        <svg
          className="w-4 h-4 rotate-180 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="space-y-3 bg-theme-sidebar rounded-xl border border-theme-border p-4">
        {hasDate && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-theme-muted">
              Agendada para{' '}
              <time dateTime={task.scheduledDate}>
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                  new Date(`${task.scheduledDate}T00:00:00`)
                )}
              </time>
            </p>
            <button
              onClick={() =>
                updateTask(task.id, { scheduledDate: undefined, recurring: undefined })
              }
              className="px-3 py-1.5 text-xs font-medium text-theme-text bg-theme-bg border border-theme-border rounded-lg hover:border-red-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 shrink-0"
            >
              Remover
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-theme-text mb-2" htmlFor={`${task.id}-scheduled-date`}>
            Escolher data
          </label>
          <input
            id={`${task.id}-scheduled-date`}
            type="date"
            value={task.scheduledDate || ''}
            onChange={(e) => {
              const dateStr = e.target.value;
              if (dateStr) {
                updateTask(task.id, {
                  scheduledDate: dateStr,
                  recurring: undefined,
                });
              }
            }}
            className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
          />
        </div>
      </div>
    </div>
  );
}