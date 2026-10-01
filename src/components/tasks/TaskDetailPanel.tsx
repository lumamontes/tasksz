/**
 * TaskDetailPanel Component
 * Detail view for one task. The caller owns selection so the Tasks tab and
 * the Areas workspace can each keep an independent open task.
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $tasks, $subtasks, isTaskCompleted, toggleTaskCompleted, updateTask, deleteTask, archiveTasks } from '../../stores/tasksStore';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { isRendered } from '../../utils/accessibility';
import { TaskDetailTopBar } from './TaskDetailTopBar';
import { TaskSummaryStrip } from './TaskSummaryStrip';
import { SubtasksSection } from './SubtasksSection';
import { DescriptionSection } from './DescriptionSection';
import { CalendarSection } from './CalendarSection';
import { TaskUndoToast } from './TaskUndoToast';
import type { Task } from '../../types';

interface UndoAction {
  type: 'archive' | 'delete';
  taskId: string;
  taskData: Pick<Task, 'archived'>;
}

interface TaskDetailPanelProps {
  taskId: string | null;
  /** Ordered tasks walked by the previous/next controls. */
  navigationTasks: Task[];
  onSelectTask: (taskId: string | null) => void;
}

export function TaskDetailPanel({ taskId, navigationTasks, onSelectTask }: TaskDetailPanelProps) {
  const tasks = useStore($tasks);
  const subtasks = useStore($subtasks);
  const selectedTask = taskId ? tasks.find((task) => task.id === taskId) ?? null : null;
  const selectedTaskSubtasks = selectedTask
    ? subtasks.filter((subtask) => subtask.taskId === selectedTask.id).sort((a, b) => a.order - b.order)
    : [];
  const selectedTaskIndex = selectedTask ? navigationTasks.findIndex((task) => task.id === selectedTask.id) : -1;
  const [isEditMode, setIsEditMode] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [showSavedHint, setShowSavedHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { requestConfirm, confirmDialog } = useConfirmDialog();

  // Keyboard shortcuts for task navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRendered(containerRef.current)) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Task navigation: Ctrl/Cmd + Arrow Up/Down
      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (e.key === 'ArrowUp' && selectedTaskIndex > 0) {
          const prevTask = navigationTasks[selectedTaskIndex - 1];
          if (prevTask) {
            onSelectTask(prevTask.id);
            setIsEditMode(false);
          }
        } else if (e.key === 'ArrowDown' && selectedTaskIndex >= 0 && selectedTaskIndex < navigationTasks.length - 1) {
          const nextTask = navigationTasks[selectedTaskIndex + 1];
          if (nextTask) {
            onSelectTask(nextTask.id);
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
          onSelectTask(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIndex, navigationTasks, isEditMode, onSelectTask]);

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
    const taskId = selectedTask.id;
    const wasArchived = selectedTask.archived;
    const setArchived = async () => {
      await archiveTasks([taskId], !wasArchived);
      setUndoAction({ type: 'archive', taskId, taskData: { archived: wasArchived } });
    };

    // Unarchiving restores the task, so only archiving asks first.
    if (wasArchived) {
      setArchived().catch((error) => console.error('Unarchive failed:', error));
      return;
    }
    requestConfirm({
      title: 'Arquivar tarefa?',
      description: `“${selectedTask.title}” deixará a listagem padrão. Você encontra a tarefa depois no filtro Arquivadas.`,
      confirmLabel: 'Arquivar',
      failureMessage: 'Não foi possível arquivar a tarefa.',
      onConfirm: setArchived,
    });
  };

  const handleDelete = () => {
    if (!selectedTask) return;
    const taskId = selectedTask.id;
    requestConfirm({
      title: 'Excluir tarefa?',
      description: `“${selectedTask.title}” e suas subtarefas serão excluídas. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir tarefa',
      failureMessage: 'Não foi possível excluir a tarefa.',
      onConfirm: () => deleteTask(taskId),
    });
  };

  const handleUndo = () => {
    if (!undoAction) return;

    if (undoAction.type === 'archive') {
      updateTask(undoAction.taskId, { archived: undoAction.taskData.archived });
    } else if (undoAction.type === 'delete') {
      // Deleting a task also removes its subtasks, so restore it here
      // (subtasks would need to be restored too — prevented via confirm).
    }

    setUndoAction(null);
  };

  const handlePrevTask = () => {
    if (selectedTaskIndex > 0) {
      const prevTask = navigationTasks[selectedTaskIndex - 1];
      if (prevTask) {
        onSelectTask(prevTask.id);
        setIsEditMode(false);
      }
    }
  };

  const handleNextTask = () => {
    if (selectedTaskIndex >= 0 && selectedTaskIndex < navigationTasks.length - 1) {
      const nextTask = navigationTasks[selectedTaskIndex + 1];
      if (nextTask) {
        onSelectTask(nextTask.id);
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
            isCompleted={isTaskCompleted(selectedTask.id, selectedTask, selectedTaskSubtasks)}
            onToggleCompleted={() => toggleTaskCompleted(selectedTask.id)}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onClose={() => onSelectTask(null)}
            onPrevTask={handlePrevTask}
            onNextTask={handleNextTask}
            canGoPrev={selectedTaskIndex > 0}
            canGoNext={selectedTaskIndex >= 0 && selectedTaskIndex < navigationTasks.length - 1}
          />
          {showSavedHint && (
            <div className="absolute top-16 right-6 bg-theme-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
              Salvo
            </div>
          )}
        </div>

         {/* Content */}
         <div className="py-6">
          {/* Description - Primary */}
          <DescriptionSection key={`${selectedTask.id}-description`} task={selectedTask} isEditMode={isEditMode} />

          {/* Subtasks - Working Area */}
           <SubtasksSection key={`${selectedTask.id}-subtasks`} task={selectedTask} subtasks={selectedTaskSubtasks} />

           <TaskSummaryStrip key={`${selectedTask.id}-organization`} task={selectedTask} />

           {/* Calendar and date range */}
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
      {confirmDialog}
    </>
  );
}
