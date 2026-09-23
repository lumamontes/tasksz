import { atom } from 'nanostores';
import type { Project } from '../types';
import { rxInsertProject, rxRemoveProject, rxUpdateProject, rxUpdateTask } from '../lib/rxdb/bridge';
import { $tasks } from './tasksStore';
import { projectCreateSchema, projectInputSchema, type ProjectInput } from '../domain/areasProjects/schemas';

export const $projects = atom<Project[]>([]);

export async function addProject(input: ProjectInput) {
  const parsed = projectCreateSchema.parse(input);
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

export async function deleteProject(id: string) {
  const tasks = $tasks.get().filter((item) => item.projectId === id);
  await Promise.all(tasks.map((task) => rxUpdateTask(task.id, { ...task, projectId: undefined, updatedAt: new Date() })));
  await rxRemoveProject(id);
}
