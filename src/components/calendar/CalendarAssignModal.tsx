/**
 * CalendarAssignModal Component
 * Modal for quickly assigning tasks to a date
 * ND-safe: Simple search, no pressure
 */

import { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $tasks, updateTask } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';

interface CalendarAssignModalProps {
  dateStr: string; // YYYY-MM-DD
  onClose: () => void;
  onAssign?: () => void;
}

export function CalendarAssignModal({ dateStr, onClose, onAssign }: CalendarAssignModalProps) {
  const tasks = useStore($tasks);
  const settings = useStore($settings);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks: exclude archived, exclude already scheduled for this date
  const availableTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.archived) return false;
      // Don't show tasks already scheduled for this date
      if (task.scheduledDate === dateStr) return false;
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(query) ||
               (task.description && task.description.toLowerCase().includes(query));
      }
      return true;
    });
  }, [tasks, dateStr, searchQuery]);

  const handleAssign = (taskId: string) => {
    updateTask(taskId, { scheduledDate: dateStr });
    onAssign?.();
    onClose();
  };

  const transitionClass = settings.reduceMotion ? '' : 'transition-all duration-200';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
    >
      <div 
        className={`bg-theme-panel rounded-xl border border-theme-border shadow-xl max-w-md w-full max-h-[80vh] flex flex-col ${
          settings.density === 'compact' ? 'p-4' : 'p-6'
        } ${transitionClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 
            id="assign-modal-title"
            className={`font-semibold text-theme-text mb-2 ${
              settings.fontScale === 'sm' ? 'text-lg' :
              settings.fontScale === 'lg' ? 'text-2xl' :
              settings.fontScale === 'xl' ? 'text-3xl' :
              'text-xl'
            }`}
          >
            Associar uma tarefa
          </h2>
          <p className="text-sm text-theme-muted">
            Selecione uma tarefa para associar a este dia
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefa…"
            className={`w-full px-4 py-2 bg-theme-sidebar border border-theme-border rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent ${
              settings.fontScale === 'sm' ? 'text-sm' :
              settings.fontScale === 'lg' ? 'text-base' :
              settings.fontScale === 'xl' ? 'text-lg' :
              'text-sm'
            } ${transitionClass}`}
            autoFocus
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {availableTasks.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <p className="text-sm">
                {searchQuery.trim() 
                  ? 'Nenhuma tarefa encontrada' 
                  : 'Nenhuma tarefa disponível'}
              </p>
            </div>
          ) : (
            availableTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleAssign(task.id)}
                className={`w-full text-left p-3 bg-theme-sidebar border border-theme-border rounded-lg hover:border-theme-accent hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
              >
                <h3 className={`font-medium text-theme-text ${
                  settings.fontScale === 'sm' ? 'text-sm' :
                  settings.fontScale === 'lg' ? 'text-base' :
                  settings.fontScale === 'xl' ? 'text-lg' :
                  'text-sm'
                }`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className={`text-theme-muted mt-1 line-clamp-2 ${
                    settings.fontScale === 'sm' ? 'text-xs' :
                    settings.fontScale === 'lg' ? 'text-sm' :
                    settings.fontScale === 'xl' ? 'text-base' :
                    'text-xs'
                  }`}>
                    {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                    {task.description.length > 100 ? '...' : ''}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-theme-text bg-theme-sidebar hover:bg-theme-bg border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent ${transitionClass}`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
