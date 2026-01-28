/**
 * CalendarDayPanel Component
 * Right panel showing tasks for the selected day
 * ND-safe: Clear separation, calm presentation, no pressure
 */

import { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { 
  getScheduledTasksForDate, 
  getRecurringTasksForDate,
  getTaskProgress, 
  selectTask,
  updateTask 
} from '../../stores/tasksStore';
import { $settings, setCurrentSection } from '../../stores/settingsStore';
import { parseDateLocal, getTodayString } from '../../utils/dateUtils';
import { CalendarAssignModal } from './CalendarAssignModal';

interface CalendarDayPanelProps {
  dateStr: string | null; // YYYY-MM-DD
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

type FilterType = 'all' | 'scheduled' | 'routines';

export function CalendarDayPanel({ dateStr }: CalendarDayPanelProps) {
  const settings = useStore($settings);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Separate scheduled tasks from recurring tasks
  const scheduledTasks = useMemo(() => {
    if (!dateStr) return [];
    return getScheduledTasksForDate(dateStr);
  }, [dateStr]);

  const recurringTasks = useMemo(() => {
    if (!dateStr) return [];
    return getRecurringTasksForDate(dateStr);
  }, [dateStr]);

  // Filter tasks based on selected filter
  const displayedScheduledTasks = useMemo(() => {
    if (filter === 'routines') return [];
    return scheduledTasks;
  }, [scheduledTasks, filter]);

  const displayedRecurringTasks = useMemo(() => {
    if (filter === 'scheduled') return [];
    return recurringTasks;
  }, [recurringTasks, filter]);

  const hasAnyTasks = scheduledTasks.length > 0 || recurringTasks.length > 0;
  const showScheduledSection = displayedScheduledTasks.length > 0 || filter === 'all';
  const showRecurringSection = displayedRecurringTasks.length > 0 || filter === 'all';

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!dateStr) return null;
    
    const todayStr = getTodayString();
    if (dateStr === todayStr) {
      return 'Hoje';
    }
    
    const date = parseDateLocal(dateStr);
    const weekday = WEEKDAYS[date.getDay()];
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    
    return `${weekday}, ${day} de ${month} de ${year}`;
  }, [dateStr]);

  const handleTaskClick = (taskId: string) => {
    // Switch to tasks section and select the task
    setCurrentSection('tasks');
    selectTask(taskId);
  };

  const handleUnassign = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(taskId, { scheduledDate: undefined });
  };

  const transitionClass = settings.reduceMotion ? '' : 'transition-all duration-200';
  const paddingClass = settings.density === 'compact' ? 'p-6' : 'p-8';
  const spacingClass = settings.density === 'compact' ? 'space-y-2' : 'space-y-3';

  if (!dateStr) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-theme-sidebar p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-secondary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-theme-text mb-2">
            Detalhes do Dia
          </h3>
          <p className="text-theme-muted mb-4">
            Selecione um dia no calendário para ver as tarefas e eventos associados a essa data.
          </p>
          <div className="text-sm text-theme-muted space-y-1">
            <p>📅 Tarefas agendadas</p>
            <p>🔄 Rotinas recorrentes</p>
            <p>✅ Progresso do dia</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto bg-theme-sidebar">
        <div className={paddingClass}>
          {/* Header */}
          <div className="mb-6">
            <h2 className={`font-semibold text-theme-text mb-1 ${
              settings.fontScale === 'sm' ? 'text-xl' :
              settings.fontScale === 'lg' ? 'text-3xl' :
              settings.fontScale === 'xl' ? 'text-4xl' :
              'text-2xl'
            }`}>
              {formattedDate?.split(',')[0] || formattedDate}
            </h2>
            {formattedDate && formattedDate.includes(',') && (
              <p className={`text-theme-muted ${
                settings.fontScale === 'sm' ? 'text-xs' :
                settings.fontScale === 'lg' ? 'text-sm' :
                settings.fontScale === 'xl' ? 'text-base' :
                'text-xs'
              }`}>
                {formattedDate.split(', ').slice(1).join(', ')}
              </p>
            )}
          </div>

          {/* Filter Chips */}
          {hasAnyTasks && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                  filter === 'all'
                    ? 'bg-theme-accent/10 border-theme-accent text-theme-text'
                    : 'bg-theme-sidebar border-theme-border text-theme-muted hover:bg-theme-bg'
                } ${transitionClass}`}
              >
                Tudo
              </button>
              {scheduledTasks.length > 0 && (
                <button
                  onClick={() => setFilter('scheduled')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    filter === 'scheduled'
                      ? 'bg-theme-accent/10 border-theme-accent text-theme-text'
                      : 'bg-theme-sidebar border-theme-border text-theme-muted hover:bg-theme-bg'
                  } ${transitionClass}`}
                >
                  Somente hoje
                </button>
              )}
              {recurringTasks.length > 0 && (
                <button
                  onClick={() => setFilter('routines')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    filter === 'routines'
                      ? 'bg-theme-accent/10 border-theme-accent text-theme-text'
                      : 'bg-theme-sidebar border-theme-border text-theme-muted hover:bg-theme-bg'
                  } ${transitionClass}`}
                >
                  Somente rotinas
                </button>
              )}
            </div>
          )}

          {/* Tasks List */}
          {!hasAnyTasks ? (
            <div className={`bg-theme-bg rounded-xl border border-theme-border ${
              settings.density === 'compact' ? 'p-8' : 'p-12'
            } text-center`}>
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className={`font-semibold text-theme-text mb-2 ${
                settings.fontScale === 'sm' ? 'text-base' :
                settings.fontScale === 'lg' ? 'text-lg' :
                settings.fontScale === 'xl' ? 'text-xl' :
                'text-base'
              }`}>
                Dia livre! 🌟
              </h3>
              <p className={`text-theme-muted mb-6 ${
                settings.fontScale === 'sm' ? 'text-sm' :
                settings.fontScale === 'lg' ? 'text-base' :
                settings.fontScale === 'xl' ? 'text-lg' :
                'text-sm'
              }`}>
                Nenhuma tarefa associada a esse dia. Que tal aproveitar para descansar ou adicionar algo especial?
              </p>
              <button
                onClick={() => setShowAssignModal(true)}
                className={`px-6 py-3 text-sm font-medium text-white bg-theme-accent hover:opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${transitionClass}`}
              >
                ✨ Adicionar uma tarefa
              </button>
            </div>
          ) : (
            <div className={spacingClass}>
              {/* Scheduled Tasks Section */}
              {showScheduledSection && (
                <div className="mb-6">
                  <h3 className={`font-medium text-theme-text mb-3 ${
                    settings.fontScale === 'sm' ? 'text-sm' :
                    settings.fontScale === 'lg' ? 'text-lg' :
                    settings.fontScale === 'xl' ? 'text-xl' :
                    'text-base'
                  }`}>
                    Tarefas do dia
                  </h3>
                  {displayedScheduledTasks.length === 0 ? (
                    <p className={`text-theme-muted ${
                      settings.fontScale === 'sm' ? 'text-xs' :
                      settings.fontScale === 'lg' ? 'text-sm' :
                      settings.fontScale === 'xl' ? 'text-base' :
                      'text-xs'
                    }`}>
                      Nenhuma tarefa agendada para este dia.
                    </p>
                  ) : (
                    <div className={spacingClass}>
                      {displayedScheduledTasks.map((task) => {
                        const progress = getTaskProgress(task.id);
                        return (
                          <TaskRow
                            key={task.id}
                            task={task}
                            progress={progress}
                            onTaskClick={handleTaskClick}
                            onUnassign={handleUnassign}
                            settings={settings}
                            transitionClass={transitionClass}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recurring Tasks Section */}
              {showRecurringSection && (
                <div>
                  <h3 className={`font-medium text-theme-text mb-3 ${
                    settings.fontScale === 'sm' ? 'text-sm' :
                    settings.fontScale === 'lg' ? 'text-lg' :
                    settings.fontScale === 'xl' ? 'text-xl' :
                    'text-base'
                  }`}>
                    Rotinas
                  </h3>
                  {displayedRecurringTasks.length === 0 ? (
                    <p className={`text-theme-muted ${
                      settings.fontScale === 'sm' ? 'text-xs' :
                      settings.fontScale === 'lg' ? 'text-sm' :
                      settings.fontScale === 'xl' ? 'text-base' :
                      'text-xs'
                    }`}>
                      Nenhuma rotina para este dia.
                    </p>
                  ) : (
                    <div className={spacingClass}>
                      {displayedRecurringTasks.map((task) => {
                        const progress = getTaskProgress(task.id);
                        return (
                          <TaskRow
                            key={task.id}
                            task={task}
                            progress={progress}
                            onTaskClick={handleTaskClick}
                            onUnassign={undefined}
                            settings={settings}
                            transitionClass={transitionClass}
                            isRecurring={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Assign Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className={`w-full px-4 py-2 text-sm font-medium text-theme-text bg-theme-sidebar hover:bg-theme-bg border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
                >
                  Associar uma tarefa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <CalendarAssignModal
          dateStr={dateStr}
          onClose={() => setShowAssignModal(false)}
          onAssign={() => {
            // Modal will close automatically after assignment
          }}
        />
      )}
    </>
  );
}

// Task Row Component
interface TaskRowProps {
  task: any;
  progress: { completed: number; total: number; percentage: number };
  onTaskClick: (taskId: string) => void;
  onUnassign?: (taskId: string, e: React.MouseEvent) => void;
  settings: any;
  transitionClass: string;
  isRecurring?: boolean;
}

function TaskRow({ 
  task, 
  progress, 
  onTaskClick, 
  onUnassign,
  settings,
  transitionClass,
  isRecurring = false 
}: TaskRowProps) {
  const paddingClass = settings.density === 'compact' ? 'p-3' : 'p-4';
  
  return (
    <button
      onClick={() => onTaskClick(task.id)}
      className={`w-full text-left ${paddingClass} bg-theme-sidebar border border-theme-border rounded-xl hover:border-theme-accent hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent group ${transitionClass}`}
      aria-label={`Tarefa: ${task.title}${progress.total > 0 ? `, ${progress.completed} de ${progress.total} subtarefas concluídas` : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-theme-text group-hover:text-theme-accent ${transitionClass} ${
              settings.fontScale === 'sm' ? 'text-sm' :
              settings.fontScale === 'lg' ? 'text-base' :
              settings.fontScale === 'xl' ? 'text-lg' :
              'text-sm'
            }`}>
              {task.title}
            </h3>
            {isRecurring && (
              <span className={`text-theme-muted bg-theme-bg px-2 py-0.5 rounded-full ${
                settings.fontScale === 'sm' ? 'text-xs' :
                settings.fontScale === 'lg' ? 'text-sm' :
                settings.fontScale === 'xl' ? 'text-base' :
                'text-xs'
              }`}>
                {task.recurring.type === 'daily' ? 'Diária' : 'Semanal'}
              </span>
            )}
          </div>
          {task.description && (
            <p className={`text-theme-muted line-clamp-2 mb-2 ${
              settings.fontScale === 'sm' ? 'text-xs' :
              settings.fontScale === 'lg' ? 'text-sm' :
              settings.fontScale === 'xl' ? 'text-base' :
              'text-xs'
            }`}>
              {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
              {task.description.length > 100 ? '...' : ''}
            </p>
          )}
          {settings.showProgressBars && progress.total > 0 && (
            <div className="mt-2">
              <div className={`flex items-center justify-between text-theme-muted mb-1 ${
                settings.fontScale === 'sm' ? 'text-xs' :
                settings.fontScale === 'lg' ? 'text-sm' :
                settings.fontScale === 'xl' ? 'text-base' :
                'text-xs'
              }`}>
                <span>Progresso</span>
                <span>{progress.completed}/{progress.total}</span>
              </div>
              <div className="w-full h-1.5 bg-theme-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-theme-accent"
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
        <div className="flex items-center gap-2 shrink-0">
          {onUnassign && !isRecurring && (
            <button
              onClick={(e) => onUnassign(task.id, e)}
              className={`p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
              aria-label={`Remover tarefa ${task.title} deste dia`}
              title="Remover deste dia"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className="w-5 h-5 text-theme-muted group-hover:text-theme-accent shrink-0 mt-0.5"
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
      </div>
    </button>
  );
}
