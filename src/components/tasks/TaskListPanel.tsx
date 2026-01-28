/**
 * TaskListPanel Component
 * Center panel showing filtered tasks with progress bars
 */

import { useStore } from '@nanostores/react';
import { $filteredTasks, $selectedTaskId, selectTask, getTaskProgress } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { useState, useEffect, useRef } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus } from 'lucide-react';

interface TaskListPanelProps {
  onTaskSelect: (taskId: string) => void;
  onCreateTask: () => void;
}

export function TaskListPanel({ onTaskSelect, onCreateTask }: TaskListPanelProps) {
  const filteredTasks = useStore($filteredTasks);
  const selectedTaskId = useStore($selectedTaskId);
  const settings = useStore($settings);
  
  // ND-specific behavior based on executive load
  const executiveLoad = settings.ndSettings?.executiveLoad || 'standard';
  const isMinimalMode = executiveLoad === 'minimal';
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

  // Keyboard navigation - Arrow Down / J
  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const nextIndex = Math.min(currentIndex + 1, displayTasks.length - 1);
        setFocusedIndex(nextIndex);
        selectTask(displayTasks[nextIndex].id);
      }
    },
    { key: 'ArrowDown', enabled: true, ignoreInputs: true }
  );

  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const nextIndex = Math.min(currentIndex + 1, displayTasks.length - 1);
        setFocusedIndex(nextIndex);
        selectTask(displayTasks[nextIndex].id);
      }
    },
    { key: 'j', enabled: true, ignoreInputs: true }
  );

  // Keyboard navigation - Arrow Up / K
  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedIndex(prevIndex);
        selectTask(displayTasks[prevIndex].id);
      }
    },
    { key: 'ArrowUp', enabled: true, ignoreInputs: true }
  );

  useKeyboardShortcut(
    () => {
      if (displayTasks.length > 0) {
        const currentIndex = focusedIndex >= 0 ? focusedIndex : 
          (selectedTaskId ? displayTasks.findIndex(t => t.id === selectedTaskId) : 0);
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedIndex(prevIndex);
        selectTask(displayTasks[prevIndex].id);
      }
    },
    { key: 'k', enabled: true, ignoreInputs: true }
  );

  // Keyboard navigation - Enter
  useKeyboardShortcut(
    () => {
      if (focusedIndex >= 0 && displayTasks[focusedIndex]) {
        onTaskSelect(displayTasks[focusedIndex].id);
      }
    },
    { key: 'Enter', enabled: focusedIndex >= 0, ignoreInputs: true }
  );

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
            <Plus />
          </Button>
        </div>
        
        {/* Search - Hidden in minimal mode to reduce cognitive load */}
        {!isMinimalMode && (
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefa…"
            size="sm"
            fullWidth
          />
        )}
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
              const isCompleted = progress.total > 0 && progress.percentage === 100;
              const isSelected = task.id === selectedTaskId;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-theme-accent ${
                    isCompleted
                      ? 'bg-theme-sidebar border-theme-border text-theme-muted opacity-60'
                      : isSelected
                      ? 'bg-theme-accent/10 border-theme-accent/30 text-theme-text'
                      : isFocused
                      ? 'bg-theme-bg border-theme-border text-theme-text'
                      : 'bg-theme-panel border-theme-border hover:border-theme-accent/50 text-theme-text'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isCompleted && (
                          <div className="w-5 h-5 rounded-full bg-theme-muted/30 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <h3 className={`font-medium text-base truncate ${
                          isCompleted ? 'line-through' : ''
                        }`}>
                          {task.title}
                        </h3>
                      </div>
                      {task.description && (
                        <p className="text-sm line-clamp-2 mb-2 text-theme-muted">
                          {task.description}
                        </p>
                      )}
                      {/* Progress bar - Hidden in minimal mode or if user disabled */}
                      {settings.showProgressBars && progress.total > 0 && !isMinimalMode && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-theme-border rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isCompleted ? 'bg-theme-muted/50' : 'bg-theme-accent'
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
