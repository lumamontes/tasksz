import type { Area, Project, Subtask, Task } from '../types';
import { isTaskCompletedValue } from '../domain/tasks/completion';

export interface AreaTaskGroup {
  project: Project | null;
  tasks: Task[];
}

export interface AreaTaskView {
  area: Area;
  taskCount: number;
  groups: AreaTaskGroup[];
}

export function selectAreaTaskView(
  area: Area,
  tasks: Task[],
  projects: Project[],
): AreaTaskView {
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const areaTasks = tasks.filter((task) => !task.archived && task.projectId && projectsById.get(task.projectId)?.areaId === area.id);
  const groups = new Map<string | null, Task[]>();

  for (const task of areaTasks) {
    const projectId = task.projectId && projectsById.has(task.projectId) ? task.projectId : null;
    groups.set(projectId, [...(groups.get(projectId) || []), task]);
  }

  return {
    area,
    taskCount: areaTasks.length,
    groups: [...groups.entries()].map(([projectId, groupedTasks]) => ({
      project: projectId ? projectsById.get(projectId) || null : null,
      tasks: groupedTasks,
    })),
  };
}

export function selectAreaTaskCompletion(task: Task, subtasks: Subtask[]) {
  const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id);
  return {
    completed: isTaskCompletedValue(task, taskSubtasks),
    progress: {
      completed: taskSubtasks.filter((subtask) => subtask.done).length,
      total: taskSubtasks.length,
    },
  };
}
