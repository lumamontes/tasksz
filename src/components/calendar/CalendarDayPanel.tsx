/**
 * CalendarDayPanel Component
 * Right panel showing tasks for the selected day
 */

import { useStore } from '@nanostores/react';
import { getTasksForDate, getTaskProgress, selectTask } from '../../stores/tasksStore';
import { $settings, setCurrentSection } from '../../stores/settingsStore';
import { $subtasks } from '../../stores/tasksStore';
import { parseDateLocal, getTodayString } from '../../utils/dateUtils';
import { useMemo } from 'react';

interface CalendarDayPanelProps {
  dateStr: string | null; // YYYY-MM-DD
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function CalendarDayPanel({ dateStr }: CalendarDayPanelProps) {
  const settings = useStore($settings);
  const subtasks = useStore($subtasks);

  const tasks = useMemo(() => {
    if (!dateStr) return [];
    return getTasksForDate(dateStr);
  }, [dateStr]);

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!dateStr) return null;
    
    const todayStr = getTodayString();
    if (dateStr === todayStr) {
      return 'Hoje';
    }
    
    const date = parseDateLocal(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [dateStr]);

  const handleTaskClick = (taskId: string) => {
    // Switch to tasks section and select the task
    setCurrentSection('tasks');
    selectTask(taskId);
  };

  if (!dateStr) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-panel">
        <p className="text-theme-muted text-center px-8">
          Selecione um dia para ver as tarefas associadas
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-theme-panel">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-theme-text mb-1">
            {formattedDate}
          </h2>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-theme-sidebar rounded-xl border border-theme-border p-12 text-center">
            <svg 
              className="mx-auto h-12 w-12 text-theme-muted mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
            <p className="text-theme-muted">
              Nenhuma tarefa associada a esse dia.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const progress = getTaskProgress(task.id);
              const isRecurring = !!task.recurring;
              const isScheduled = !!task.scheduledDate;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="w-full text-left p-4 bg-theme-sidebar border border-theme-border rounded-xl hover:border-theme-accent hover:bg-theme-bg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent group"
                  aria-label={`Tarefa: ${task.title}${progress.total > 0 ? `, ${progress.completed} de ${progress.total} subtarefas concluídas` : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-theme-text group-hover:text-theme-accent transition-colors">
                          {task.title}
                        </h3>
                        {isRecurring && (
                          <span className="text-xs text-theme-muted bg-theme-bg px-2 py-0.5 rounded-full">
                            {task.recurring.type === 'daily' ? 'Diária' : 'Semanal'}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-theme-muted line-clamp-2 mb-2">
                          {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                          {task.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                      {settings.showProgressBars && progress.total > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                            <span>Progresso</span>
                            <span>{progress.percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-theme-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-theme-accent transition-all"
                              style={{ 
                                width: `${progress.percentage}%`,
                                transitionDuration: settings.reduceMotion ? '0ms' : '300ms'
                              }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-theme-muted group-hover:text-theme-accent transition-colors shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
