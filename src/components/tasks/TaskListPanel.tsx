/**
 * TaskListPanel Component
 * Center panel showing filtered tasks with progress bars
 */

import { useStore } from '@nanostores/react';
import { $filteredTasks, $selectedTaskId, selectTask, getTaskProgress } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';

interface TaskListPanelProps {
  onTaskSelect: (taskId: string) => void;
  onCreateTask: () => void;
}

export function TaskListPanel({ onTaskSelect, onCreateTask }: TaskListPanelProps) {
  const filteredTasks = useStore($filteredTasks);
  const selectedTaskId = useStore($selectedTaskId);
  const settings = useStore($settings);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter by search query
  const displayTasks = searchQuery.trim()
    ? filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTasks;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (displayTasks.length > 0) {
          const currentIndex = focusedIndex >= 0 ? focusedIndex : 
            (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
          const nextIndex = Math.min(currentIndex + 1, displayTasks.length - 1);
          setFocusedIndex(nextIndex);
          selectTask(displayTasks[nextIndex].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (displayTasks.length > 0) {
          const currentIndex = focusedIndex >= 0 ? focusedIndex : 
            (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
          const prevIndex = Math.max(currentIndex - 1, 0);
          setFocusedIndex(prevIndex);
          selectTask(displayTasks[prevIndex].id);
        }
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        if (displayTasks[focusedIndex]) {
          onTaskSelect(displayTasks[focusedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayTasks, focusedIndex, selectedTaskId, onTaskSelect]);

  // Reset focused index when selection changes externally
  useEffect(() => {
    if (selectedTaskId) {
      const index = displayTasks.findIndex(t => t.id === selectedTaskId);
      if (index >= 0) {
        setFocusedIndex(index);
      }
    }
  }, [selectedTaskId, displayTasks]);

  const handleTaskClick = (taskId: string) => {
    selectTask(taskId);
    onTaskSelect(taskId);
    setFocusedIndex(displayTasks.findIndex(t => t.id === taskId));
  };

  return (
    <div className="h-full flex flex-col bg-theme-sidebar border-r border-theme-border">
      {/* Header */}
      <div className="p-6 border-b border-theme-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-theme-text">Tarefas</h2>
          <Button onClick={onCreateTask} size="small">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefa…"
            className="w-full px-4 py-2 pl-10 bg-theme-panel border border-theme-border rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-theme-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Task List */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        {displayTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-theme-muted">
              {searchQuery.trim() 
                ? 'Nenhuma tarefa encontrada'
                : 'Nenhuma tarefa nesta categoria'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayTasks.map((task, index) => {
              const progress = getTaskProgress(task.id);
              const isSelected = task.id === selectedTaskId;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    settings.reduceMotion ? '' : 'duration-200'
                  } focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                    isSelected
                      ? 'bg-theme-accent/10 border-theme-accent/30 text-theme-text'
                      : isFocused
                      ? 'bg-theme-bg border-theme-border text-theme-text'
                      : 'bg-theme-panel border-theme-border hover:border-theme-accent/50 text-theme-text'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1 truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-theme-muted line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      {/* Progress bar */}
                      {settings.showProgressBars && progress.total > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-theme-border rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-theme-accent ${
                                settings.reduceMotion ? '' : 'transition-all duration-300'
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                              role="progressbar"
                              aria-valuenow={progress.percentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${progress.completed} de ${progress.total} subtarefas concluídas`}
                            />
                          </div>
                          <span className="text-xs text-theme-muted">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                      )}
                    </div>
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
