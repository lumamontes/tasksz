/**
 * TaskDetail Component
 * Right panel showing selected task details and subtasks
 * Refactored to use TaskDetailPanel for cleaner architecture
 */

import { TaskDetailPanel } from './TaskDetailPanel';

export function TaskDetail() {
  return <TaskDetailPanel />;
}