/**
 * TaskDetail Component
 * Right panel of the Tasks tab: the task selected in the day's task list.
 */

import { useStore } from '@nanostores/react';
import { $filteredTasks, $selectedTaskId, selectTask } from '../../stores/tasksStore';
import { TaskDetailPanel } from './TaskDetailPanel';

export function TaskDetail() {
  const selectedTaskId = useStore($selectedTaskId);
  const filteredTasks = useStore($filteredTasks);
  return <TaskDetailPanel taskId={selectedTaskId} navigationTasks={filteredTasks} onSelectTask={selectTask} />;
}
