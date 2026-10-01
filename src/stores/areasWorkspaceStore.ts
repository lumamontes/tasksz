/**
 * Areas Workspace Store
 * Navigation state for the Areas section, shared by its list and detail
 * islands. Task selection here is independent from the Tasks tab so a Project
 * task stays open regardless of the day or filters chosen in the task list.
 */

import { atom, computed } from 'nanostores';
import type { AreaInput, ProjectInput } from '../domain/areasProjects/schemas';
import type { AreaProjectsChoice, ProjectTasksChoice } from '../domain/areasProjects/deletion';
import { $areas, addArea, deleteArea } from './areasStore';
import { $projects, addProject, deleteProject, updateProject } from './projectsStore';
import { $tasks } from './tasksStore';
import { setCurrentSection } from './settingsStore';
import { resolveAreasWorkspace, type AreasWorkspaceState, type ProjectTab } from './areasSelectors';

const initialState: AreasWorkspaceState = {
  areaId: null,
  view: 'overview',
  projectId: null,
  projectTab: 'overview',
  taskId: null,
  pane: 'list',
};

export const $areasWorkspace = atom<AreasWorkspaceState>(initialState);

export const $resolvedAreasWorkspace = computed(
  [$areasWorkspace, $areas, $projects, $tasks],
  resolveAreasWorkspace,
);

export type AreasDialog = { kind: 'create-area' } | { kind: 'create-project'; areaId: string };

export const $areasDialog = atom<AreasDialog | null>(null);

function patch(updates: Partial<AreasWorkspaceState>) {
  $areasWorkspace.set({ ...$areasWorkspace.get(), ...updates });
}

export function openArea(areaId: string) {
  patch({ areaId, view: 'overview', projectId: null, taskId: null, pane: 'detail' });
}

/** Compact layouts only: go back from an Area to the Area list. */
export function showAreaList() {
  patch({ pane: 'list' });
}

export function showAreaOverview() {
  patch({ view: 'overview', projectId: null, taskId: null, pane: 'detail' });
}

export function showAreaProjects() {
  patch({ view: 'projects', projectId: null, taskId: null });
}

/**
 * The Area is resolved from the store unless given, since a just-created
 * Project reaches `$projects` only after the RxDB subscription emits.
 */
export function openProject(projectId: string, areaId?: string) {
  const projectAreaId = areaId ?? $projects.get().find((item) => item.id === projectId)?.areaId;
  if (!projectAreaId) return;
  patch({ areaId: projectAreaId, view: 'project', projectId, projectTab: 'overview', taskId: null, pane: 'detail' });
}

export function setProjectTab(projectTab: ProjectTab) {
  patch({ projectTab, taskId: null });
}

export function openProjectTask(taskId: string | null) {
  patch({ taskId });
}

/** Entry point from other sections, e.g. the task list filters. */
export function openAreasWorkspace(target: { areaId?: string; projectId?: string } = {}) {
  if (target.projectId) openProject(target.projectId);
  else if (target.areaId) openArea(target.areaId);
  setCurrentSection('areas');
}

export function openCreateAreaDialog() {
  $areasDialog.set({ kind: 'create-area' });
}

export function openCreateProjectDialog(areaId: string) {
  $areasDialog.set({ kind: 'create-project', areaId });
}

export function closeAreasDialog() {
  $areasDialog.set(null);
}

export async function createArea(input: AreaInput) {
  const areaId = await addArea(input);
  openArea(areaId);
  closeAreasDialog();
}

export async function removeArea(areaId: string, choice: AreaProjectsChoice) {
  await deleteArea(areaId, choice);
  if (choice.kind === 'move') openArea(choice.toAreaId);
  else if ($areasWorkspace.get().areaId === areaId) patch({ ...initialState });
}

export async function createProject(input: ProjectInput) {
  const projectId = await addProject(input);
  closeAreasDialog();
  openProject(projectId, input.areaId);
}

export async function saveProject(projectId: string, input: ProjectInput) {
  await updateProject(projectId, input);
  // Moving a Project to another Area keeps it open in its new Area.
  if ($areasWorkspace.get().projectId === projectId) patch({ areaId: input.areaId });
}

export async function removeProject(projectId: string, choice: ProjectTasksChoice) {
  await deleteProject(projectId, choice);
  showAreaOverview();
}
