import type { Subtask, Task } from '../../types';

/** Keeps explicit completion compatible with legacy subtask-derived tasks. */
export function isTaskCompletedValue(task: Task | undefined, subtasks: Subtask[]): boolean {
  if (task?.completed !== undefined) return task.completed;
  return subtasks.length > 0 && subtasks.every((subtask) => subtask.done);
}
