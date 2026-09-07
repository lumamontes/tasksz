/**
 * TasksDetailPane Component (island)
 * Right pane of the tasks tab. Switches between the task form,
 * the task detail, or the empty state based on shared stores.
 * Lazy-loads the heavy detail/form chunks on demand.
 */

import { Suspense, lazy, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $taskForm } from '../../stores/uiStore';
import { $selectedTaskId } from '../../stores/tasksStore';
import { TaskDetailEmpty } from './TaskDetailEmpty';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const TaskFormLazy = lazy(() => import('./TaskForm').then((m) => ({ default: m.TaskForm })));
const TaskDetailLazy = lazy(() => import('./TaskDetail').then((m) => ({ default: m.TaskDetail })));

function formKey(mode: 'new' | 'edit', taskId?: string): string {
  return mode === 'edit' ? `edit:${taskId}` : 'new';
}

export function TasksDetailPane() {
  const form = useStore($taskForm);
  const selectedTaskId = useStore($selectedTaskId);

  let content: ReactNode;
  if (form) {
    content = <TaskFormLazy key={formKey(form.mode, form.mode === 'edit' ? form.taskId : undefined)} />;
  } else if (selectedTaskId) {
    content = <TaskDetailLazy key={selectedTaskId} />;
  } else {
    content = <TaskDetailEmpty />;
  }

  return (
    <div className="h-full min-w-0 bg-theme-panel">
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center text-sm text-theme-muted">
              Carregando…
            </div>
          }
        >
          {content}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}