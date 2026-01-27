/**
 * CalendarView Component
 * Calendar view for scheduling tasks and routines
 */

import { useStore } from '@nanostores/react';
import { $tasks } from '../../stores/tasksStore';

export function CalendarView() {
  const tasks = useStore($tasks);

  return (
    <div className="h-full overflow-y-auto bg-theme-panel">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-theme-text mb-2">Calendário</h1>
            <p className="text-theme-muted">
              Visualize suas tarefas e rotinas no calendário
            </p>
          </div>

          <div className="bg-theme-sidebar rounded-xl border border-theme-border p-12 text-center">
            <svg 
              className="mx-auto h-16 w-16 text-theme-muted mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <h3 className="text-xl font-medium text-theme-text mb-2">
              Calendário em desenvolvimento
            </h3>
            <p className="text-theme-muted mb-4">
              Esta funcionalidade estará disponível em breve. Você poderá visualizar suas tarefas e rotinas em um calendário interativo.
            </p>
            {tasks.filter(t => !t.archived).length > 0 && (
              <p className="text-sm text-theme-muted">
                Você tem {tasks.filter(t => !t.archived).length} tarefa{tasks.filter(t => !t.archived).length !== 1 ? 's' : ''} que poderão ser visualizadas aqui.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}