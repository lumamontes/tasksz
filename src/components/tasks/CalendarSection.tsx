/**
 * CalendarSection Component
 * Optional calendar association section
 */

import { useState } from 'react';
import { updateTask } from '../../stores/tasksStore';
import { parseDateLocal } from '../../utils/dateUtils';
import type { Task } from '../../types';

interface CalendarSectionProps {
  task: Task;
}

export function CalendarSection({ task }: CalendarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!!task.scheduledDate || !!task.recurring);

  const hasAssociation = !!task.scheduledDate || !!task.recurring;

  if (!hasAssociation) {
    return (
      <div className="mx-6 mb-6">
        <button
          onClick={() => setIsExpanded(true)}
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
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 text-sm font-medium text-theme-text hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent rounded-lg p-1 -m-1"
        aria-expanded={isExpanded}
      >
        <span>Calendário</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-3 bg-theme-sidebar rounded-xl border border-theme-border p-4">
          {/* Remove current association */}
          {hasAssociation && (
            <button
              onClick={() => updateTask(task.id, { scheduledDate: undefined, recurring: undefined })}
              className="w-full text-left px-4 py-3 bg-theme-bg border border-theme-border rounded-lg hover:border-red-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <span className="text-sm font-medium">Remover do calendário</span>
            </button>
          )}

          {!hasAssociation && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  Associar a uma data específica
                </label>
                <input
                  type="date"
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    if (dateStr) {
                      updateTask(task.id, { 
                        scheduledDate: dateStr,
                        recurring: undefined 
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                />
              </div>

              <button
                onClick={() => updateTask(task.id, { 
                  scheduledDate: undefined,
                  recurring: { type: 'daily' }
                })}
                className="w-full text-left px-4 py-3 bg-theme-bg border border-theme-border rounded-lg hover:border-theme-accent hover:text-theme-accent transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <span className="text-sm font-medium">Marcar como rotina diária</span>
              </button>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  Rotina semanal (selecione os dias)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
                    const isSelected = task.recurring?.type === 'weekly' && 
                                      task.recurring.daysOfWeek?.includes(index);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          const currentDays = task.recurring?.type === 'weekly' 
                            ? (task.recurring.daysOfWeek || [])
                            : [];
                          const newDays = isSelected
                            ? currentDays.filter(d => d !== index)
                            : [...currentDays, index].sort();
                          
                          if (newDays.length > 0) {
                            updateTask(task.id, {
                              scheduledDate: undefined,
                              recurring: { type: 'weekly', daysOfWeek: newDays }
                            });
                          } else {
                            updateTask(task.id, {
                              scheduledDate: undefined,
                              recurring: undefined
                            });
                          }
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent min-w-0 flex-shrink-0 ${
                          isSelected
                            ? 'bg-theme-accent text-white'
                            : 'bg-theme-bg text-theme-text border border-theme-border hover:border-theme-accent'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
