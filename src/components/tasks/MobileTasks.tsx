/**
 * MobileTasks Component (island)
 * Single-column layout for the tasks tab on small screens:
 * list → detail (with back button) → form, driven by shared stores.
 */

import { Suspense, lazy } from 'react';
import { useStore } from '@nanostores/react';
import { $taskForm } from '../../stores/uiStore';
import { $tasks, $selectedTaskId, selectTask } from '../../stores/tasksStore';
import { TaskListPanel } from './TaskListPanel';

const TaskFormLazy = lazy(() => import('./TaskForm').then((m) => ({ default: m.TaskForm })));
const TaskDetailLazy = lazy(() => import('./TaskDetail').then((m) => ({ default: m.TaskDetail })));

function formKey(mode: 'new' | 'edit', taskId?: string): string {
  return mode === 'edit' ? `edit:${taskId}` : 'new';
}

export function MobileTasks() {
  const form = useStore($taskForm);
  const tasks = useStore($tasks);
  const selectedTaskId = useStore($selectedTaskId);
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  if (form) {
    return (
      <div className="h-full overflow-y-auto bg-theme-panel">
        <div className="p-6">
          <TaskFormLazy key={formKey(form.mode, form.mode === 'edit' ? form.taskId : undefined)} />
        </div>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-theme-border bg-theme-sidebar">
          <button
            onClick={() => selectTask(null)}
            className="flex items-center gap-2 text-theme-text hover:text-theme-accent transition-colors"
            aria-label="Voltar para lista de tarefas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Voltar</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TaskDetailLazy key={selectedTaskId} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <TaskListPanel />
    </div>
  );
}