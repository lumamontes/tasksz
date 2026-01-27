/**
 * TaskDetailPanel Component
 * Main container for the refactored task detail view
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $selectedTask, $filteredTasks, $selectedTaskIndex, selectTask, updateTask } from '../../stores/tasksStore';
import { TaskDetailTopBar } from './TaskDetailTopBar';
import { TaskSummaryStrip } from './TaskSummaryStrip';
import { SubtasksSection } from './SubtasksSection';
import { DescriptionSection } from './DescriptionSection';
import { CalendarSection } from './CalendarSection';
import { TaskUndoToast } from './TaskUndoToast';

interface TaskDetailPanelProps {
  onDelete?: (taskId: string) => void;
}

interface UndoAction {
  type: 'archive' | 'delete';
  taskId: string;
  taskData: any;
}

export function TaskDetailPanel({ onDelete }: TaskDetailPanelProps) {
  const selectedTask = useStore($selectedTask);
  const filteredTasks = useStore($filteredTasks);
  const selectedTaskIndex = useStore($selectedTaskIndex);
  const [isEditMode, setIsEditMode] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [showSavedHint, setShowSavedHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for task navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Task navigation: Ctrl/Cmd + Arrow Up/Down
      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (e.key === 'ArrowUp' && selectedTaskIndex > 0) {
          const prevTask = filteredTasks[selectedTaskIndex - 1];
          if (prevTask) {
            selectTask(prevTask.id);
            setIsEditMode(false);
          }
        } else if (e.key === 'ArrowDown' && selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1) {
          const nextTask = filteredTasks[selectedTaskIndex + 1];
          if (nextTask) {
            selectTask(nextTask.id);
            setIsEditMode(false);
          }
        }
        return;
      }

      // Edit mode toggle: E key
      if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsEditMode(!isEditMode);
        }
        return;
      }

      // Escape: exit edit mode or close panel
      if (e.key === 'Escape') {
        if (isEditMode) {
          setIsEditMode(false);
        } else {
          selectTask(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIndex, filteredTasks, isEditMode]);

  // Focus management: when task changes, focus the container
  useEffect(() => {
    if (selectedTask && containerRef.current) {
      const heading = containerRef.current.querySelector('#task-detail-heading');
      if (heading) {
        (heading as HTMLElement).focus();
      }
    }
  }, [selectedTask?.id]);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditMode && selectedTask) {
      // Focus will be handled by TaskDetailTopBar
    }
  }, [isEditMode, selectedTask]);

  // Show "Saved" hint when leaving edit mode
  useEffect(() => {
    if (!isEditMode && selectedTask) {
      setShowSavedHint(true);
      const timer = setTimeout(() => setShowSavedHint(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, selectedTask]);

  const handleArchive = () => {
    if (!selectedTask) return;
    
    const wasArchived = selectedTask.archived;
    updateTask(selectedTask.id, { archived: !wasArchived });
    
    setUndoAction({
      type: 'archive',
      taskId: selectedTask.id,
      taskData: { archived: wasArchived }
    });
  };

  const handleDelete = () => {
    if (!selectedTask || !onDelete) return;
    
    if (confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
      onDelete(selectedTask.id);
      // Note: Delete cannot be undone, so we don't set undoAction
    }
  };

  const handleUndo = () => {
    if (!undoAction) return;

    if (undoAction.type === 'archive') {
      updateTask(undoAction.taskId, { archived: undoAction.taskData.archived });
    } else if (undoAction.type === 'delete' && onDelete) {
      // For delete, we'd need to restore the task - this would require
      // a restoreTask function in the store. For now, just clear the undo action.
      // In a full implementation, you'd restore the task here.
    }
    
    setUndoAction(null);
  };

  const handlePrevTask = () => {
    if (selectedTaskIndex > 0) {
      const prevTask = filteredTasks[selectedTaskIndex - 1];
      if (prevTask) {
        selectTask(prevTask.id);
        setIsEditMode(false);
      }
    }
  };

  const handleNextTask = () => {
    if (selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1) {
      const nextTask = filteredTasks[selectedTaskIndex + 1];
      if (nextTask) {
        selectTask(nextTask.id);
        setIsEditMode(false);
      }
    }
  };

  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-panel">
        <p className="text-theme-muted text-center px-8">
          Escolha uma tarefa para ver os detalhes.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto bg-theme-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="task-detail-heading"
        tabIndex={-1}
      >
        {/* Top Bar */}
        <div className="relative">
          <TaskDetailTopBar
            task={selectedTask}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onClose={() => selectTask(null)}
            onPrevTask={handlePrevTask}
            onNextTask={handleNextTask}
            canGoPrev={selectedTaskIndex > 0}
            canGoNext={selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1}
          />
          {showSavedHint && (
            <div className="absolute top-16 right-6 bg-theme-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
              Salvo
            </div>
          )}
        </div>

        {/* Summary Strip */}
        <TaskSummaryStrip task={selectedTask} />

        {/* Content */}
        <div className="py-6">
          {/* Subtasks - Primary Working Area */}
          <SubtasksSection task={selectedTask} />

          {/* Description - Secondary */}
          <DescriptionSection task={selectedTask} isEditMode={isEditMode} />

          {/* Calendar - Optional */}
          <CalendarSection task={selectedTask} />
        </div>
      </div>

      {/* Undo Toast - Only for archive actions */}
      {undoAction && undoAction.type === 'archive' && (
        <TaskUndoToast
          message={
            selectedTask?.archived
              ? 'Tarefa arquivada'
              : 'Tarefa desarquivada'
          }
          onUndo={handleUndo}
          onDismiss={() => setUndoAction(null)}
        />
      )}
    </>
  );
}
