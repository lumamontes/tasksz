import { useStore } from '@nanostores/react';
import { Check } from 'lucide-react';
import type { Task } from '../../types';
import { $subtasks, isTaskCompleted } from '../../stores/tasksStore';
import { openProjectTask } from '../../stores/areasWorkspaceStore';
import { EmptyRow, ListCard } from '../areas-projects/ui';

export function ProjectTaskList({ tasks, label }: { tasks: Task[]; label: string }) {
  const subtasks = useStore($subtasks);

  return (
    <ListCard label={label}>
      {tasks.map((task) => {
        const completed = isTaskCompleted(task.id, task, subtasks);
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => openProjectTask(task.id)}
               className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-theme-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-accent"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${completed ? 'border-theme-accent bg-theme-accent text-white' : 'border-theme-border'}`} aria-hidden="true">
                {completed && <Check className="h-3 w-3" />}
              </span>
              <span className={`min-w-0 flex-1 truncate text-sm ${completed ? 'text-theme-muted line-through' : 'text-theme-text'}`}>
                {task.title}
                {completed && <span className="sr-only"> (concluída)</span>}
              </span>
              {task.scheduledDate && <span className="text-xs text-theme-muted">{task.scheduledDate}</span>}
            </button>
          </li>
        );
      })}
      {tasks.length === 0 && <EmptyRow>Nenhuma tarefa neste projeto.</EmptyRow>}
    </ListCard>
  );
}
