import { atom } from 'nanostores';
import type { Project } from '../types';
import { rxInsertProject, rxRemoveProject, rxUpdateProject } from '../lib/rxdb/bridge';
import { $tasks, removeTasks, unassignTasksFromProject } from './tasksStore';
import { planProjectsDeletion, type ProjectDeletionPlan, type ProjectTasksChoice } from '../domain/areasProjects/deletion';
import { projectInputSchema, type ProjectInput } from '../domain/areasProjects/schemas';

export const $projects = atom<Project[]>([]);

export async function addProject(input: ProjectInput) {
  const parsed = projectInputSchema.parse(input);
  const now = new Date();
  const project: Project = {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    areaId: parsed.areaId,
    name: parsed.name,
    description: parsed.description || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await rxInsertProject(project);
  return project.id;
}

export async function updateProject(id: string, updates: ProjectInput) {
  const project = $projects.get().find((item) => item.id === id);
  if (!project) throw new Error('Projeto não encontrado.');
  const parsed = projectInputSchema.parse(updates);
  await rxUpdateProject(id, { ...project, ...parsed, description: parsed.description || undefined, updatedAt: new Date() });
}

export async function deleteProject(id: string, choice: ProjectTasksChoice = { deleteTasks: false }) {
  await removeProjects(planProjectsDeletion([id], choice, $tasks.get()));
}

/** Tasks are handled first so a failure never leaves tasks pointing at a removed Project. */
export async function removeProjects(plan: ProjectDeletionPlan) {
  await Promise.all([removeTasks(plan.deleteTaskIds), unassignTasksFromProject(plan.unassignTaskIds)]);
  await Promise.all(plan.projectIds.map((projectId) => rxRemoveProject(projectId)));
}
