/**
 * TaskDetail Component
 * Right panel showing selected task details and subtasks
 * Refactored to use TaskDetailPanel for cleaner architecture
 */

import { TaskDetailPanel } from './TaskDetailPanel';

interface TaskDetailProps {
  onDelete?: (taskId: string) => void;
}

export function TaskDetail({ onDelete }: TaskDetailProps) {
  return <TaskDetailPanel onDelete={onDelete} />;
}