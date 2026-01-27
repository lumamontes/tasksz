/**
 * TaskDetailTopBar Component
 * Top bar with task title, edit mode toggle, and actions
 */

import { useState } from 'react';
import { updateTask } from '../../stores/tasksStore';
import type { Task } from '../../types';

interface TaskDetailTopBarProps {
  task: Task;
  isEditMode: boolean;
  onEditModeChange: (enabled: boolean) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  onPrevTask?: () => void;
  onNextTask?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export function TaskDetailTopBar({
  task,
  isEditMode,
  onEditModeChange,
  onArchive,
  onDelete,
  onClose,
  onPrevTask,
  onNextTask,
  canGoPrev = false,
  canGoNext = false
}: TaskDetailTopBarProps) {
  const [titleValue, setTitleValue] = useState(task.title);

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateTask(task.id, { title: titleValue.trim() });
    } else {
      setTitleValue(task.title); // Reset if empty
    }
    onEditModeChange(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(task.title);
    onEditModeChange(false);
  };

  return (
    <div className="sticky top-0 z-10 bg-theme-panel border-b border-theme-border px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Title - Left */}
        <div className="flex-1 min-w-0">
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                className="flex-1 text-lg font-semibold text-theme-text bg-theme-sidebar border border-theme-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="px-3 py-2 text-sm font-medium bg-theme-accent text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-theme-accent"
                aria-label="Salvar"
              >
                Salvar
              </button>
              <button
                onClick={handleTitleCancel}
                className="px-3 py-2 text-sm font-medium bg-theme-sidebar text-theme-text rounded-lg hover:bg-theme-bg focus:outline-none focus:ring-2 focus:ring-theme-accent"
                aria-label="Cancelar"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <h1 className="text-lg font-semibold text-theme-text truncate" id="task-detail-heading">
              {task.title}
            </h1>
          )}
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditMode && (
            <>
              <button
                onClick={() => onEditModeChange(true)}
                className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                aria-label="Editar tarefa"
                title="Editar (E)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {onArchive && (
                <button
                  onClick={onArchive}
                  className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  aria-label={task.archived ? 'Desarquivar tarefa' : 'Arquivar tarefa'}
                  title={task.archived ? 'Desarquivar' : 'Arquivar'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {task.archived ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                    )}
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Excluir tarefa"
                  title="Excluir"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Fechar detalhes"
              title="Fechar (Escape)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Task Navigation */}
      {(onPrevTask || onNextTask) && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevTask}
              disabled={!canGoPrev}
              className="px-2 py-1 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Tarefa anterior"
            >
              ← Anterior
            </button>
            <span className="text-theme-muted">|</span>
            <button
              onClick={onNextTask}
              disabled={!canGoNext}
              className="px-2 py-1 text-theme-muted hover:text-theme-text hover:bg-theme-sidebar rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-theme-accent"
              aria-label="Próxima tarefa"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
