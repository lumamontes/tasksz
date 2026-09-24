/**
 * Deletion plans for Areas and Projects. Views collect the owner's choice;
 * stores execute the plan. Kept pure so the rules are testable.
 */

import type { Area, Project, Task } from '../../types';

/** What happens to the tasks of a deleted Project. */
export interface ProjectTasksChoice {
  /** When false, tasks stay in the task list without a Project. */
  deleteTasks: boolean;
}

/** What happens to the Projects of a deleted Area. Deleting them is the default. */
export type AreaProjectsChoice =
  | ({ kind: 'delete' } & ProjectTasksChoice)
  | { kind: 'move'; toAreaId: string };

export interface ProjectDeletionPlan {
  projectIds: string[];
  deleteTaskIds: string[];
  unassignTaskIds: string[];
}

export interface AreaDeletionPlan extends ProjectDeletionPlan {
  areaId: string;
  move: { projectIds: string[]; toAreaId: string } | null;
}

function taskIdsInProjects(projectIds: string[], tasks: Task[]): string[] {
  const ids = new Set(projectIds);
  return tasks.filter((task) => task.projectId && ids.has(task.projectId)).map((task) => task.id);
}

/** Every task (archived included) that deleting these Projects affects. */
export function countTasksInProjects(projectIds: string[], tasks: Task[]): number {
  return taskIdsInProjects(projectIds, tasks).length;
}

export interface AreaDeletionSummary {
  projects: Project[];
  taskCount: number;
  /** Areas that can receive the Projects instead. */
  destinationAreas: Area[];
}

/** What the owner is choosing about when deleting an Area. */
export function summarizeAreaDeletion(areaId: string, areas: Area[], projects: Project[], tasks: Task[]): AreaDeletionSummary {
  const areaProjects = projects.filter((project) => project.areaId === areaId);
  return {
    projects: areaProjects,
    taskCount: countTasksInProjects(areaProjects.map((project) => project.id), tasks),
    destinationAreas: areas.filter((area) => area.id !== areaId),
  };
}

export function planProjectsDeletion(projectIds: string[], choice: ProjectTasksChoice, tasks: Task[]): ProjectDeletionPlan {
  const taskIds = taskIdsInProjects(projectIds, tasks);
  return {
    projectIds,
    deleteTaskIds: choice.deleteTasks ? taskIds : [],
    unassignTaskIds: choice.deleteTasks ? [] : taskIds,
  };
}

export function planAreaDeletion(
  areaId: string,
  choice: AreaProjectsChoice,
  areas: Area[],
  projects: Project[],
  tasks: Task[],
): AreaDeletionPlan {
  const projectIds = projects.filter((project) => project.areaId === areaId).map((project) => project.id);

  if (choice.kind === 'move') {
    if (choice.toAreaId === areaId || !areas.some((area) => area.id === choice.toAreaId)) {
      throw new Error('Escolha outra área para receber os projetos.');
    }
    return { areaId, projectIds: [], deleteTaskIds: [], unassignTaskIds: [], move: { projectIds, toAreaId: choice.toAreaId } };
  }

  return { areaId, move: null, ...planProjectsDeletion(projectIds, choice, tasks) };
}
