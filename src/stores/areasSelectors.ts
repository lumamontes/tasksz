import type { Area, Project, Task } from '../types';

export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.name.toLocaleLowerCase().includes(normalized));
}

export function selectProjectsInArea(projects: Project[], areaId: string): Project[] {
  return projects.filter((project) => project.areaId === areaId);
}

/** Archived tasks leave the default listing, so they are not counted. */
export function countActiveTasksByProject(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.archived || !task.projectId) continue;
    counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
  }
  return counts;
}

export function countActiveTasksInArea(areaId: string, projects: Project[], tasks: Task[]): number {
  const counts = countActiveTasksByProject(tasks);
  return selectProjectsInArea(projects, areaId).reduce((total, project) => total + (counts.get(project.id) ?? 0), 0);
}

/** A task belongs to an Area only through its Project. */
export function areaOfTask(task: Pick<Task, 'projectId'>, projects: Project[]): string | undefined {
  return task.projectId ? projects.find((project) => project.id === task.projectId)?.areaId : undefined;
}

export interface TaskOrganizationLabels {
  areaName?: string;
  areaColor?: string;
  projectName?: string;
}

export function taskOrganizationLabels(task: Pick<Task, 'projectId'>, areas: Area[], projects: Project[]): TaskOrganizationLabels {
  const project = task.projectId ? projects.find((item) => item.id === task.projectId) : undefined;
  const area = project?.areaId ? areas.find((item) => item.id === project.areaId) : undefined;
  return {
    areaName: area?.name,
    areaColor: area?.color,
    projectName: project?.name,
  };
}

/** Choosing another Area drops a Project that lives outside it. */
export function projectAfterAreaChange(projectId: string | undefined, nextAreaId: string | undefined, projects: Project[]): string | undefined {
  if (!projectId || !nextAreaId) return undefined;
  return areaOfTask({ projectId }, projects) === nextAreaId ? projectId : undefined;
}

export function countProjectsByArea(projects: Project[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const project of projects) {
    if (!project.areaId) continue;
    counts.set(project.areaId, (counts.get(project.areaId) ?? 0) + 1);
  }
  return counts;
}

export function selectProjectTasks(tasks: Task[], projectId: string): Task[] {
  return tasks
    .filter((task) => !task.archived && task.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export interface TaskOrganizationFilter {
  areaId?: string;
  projectId?: string;
}

/** A task belongs to an Area only through its Project. */
export function filterTasksByOrganization(tasks: Task[], projects: Project[], filter: TaskOrganizationFilter): Task[] {
  const areaByProjectId = new Map(projects.map((project) => [project.id, project.areaId]));
  return tasks.filter((task) => {
    if (filter.projectId && task.projectId !== filter.projectId) return false;
    if (filter.areaId && (!task.projectId || areaByProjectId.get(task.projectId) !== filter.areaId)) return false;
    return true;
  });
}

export type TaskOrganizationView = 'flat' | 'area' | 'area-project' | 'project';

export interface TaskGroup {
  key: string;
  label?: string;
  color?: string;
  tasks: Task[];
}

/**
 * Groups tasks for the task list while keeping list order inside each group.
 * Tasks outside the grouping dimension stay visible in a trailing group, since
 * Areas and Projects are optional.
 */
export function groupTasksByOrganization(
  view: TaskOrganizationView,
  tasks: Task[],
  areas: Area[],
  projects: Project[],
): TaskGroup[] {
  if (view === 'flat') return [{ key: 'all', tasks }];

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const areasById = new Map(areas.map((area) => [area.id, area]));
  const groups = new Map<string, TaskGroup>();
  const unassigned: Task[] = [];

  const addTo = (key: string, label: string, color: string | undefined, task: Task) => {
    const group = groups.get(key) ?? { key, label, color, tasks: [] };
    group.tasks.push(task);
    groups.set(key, group);
  };

  for (const task of tasks) {
    const project = task.projectId ? projectsById.get(task.projectId) : undefined;
    const area = project?.areaId ? areasById.get(project.areaId) : undefined;

    if (view === 'project') {
      if (project) addTo(project.id, project.name, area?.color, task);
      else unassigned.push(task);
    } else if (view === 'area') {
      if (area) addTo(area.id, area.name, area.color, task);
      else unassigned.push(task);
    } else if (area && project) {
      addTo(`${area.id}/${project.id}`, `${area.name} / ${project.name}`, area.color, task);
    } else {
      unassigned.push(task);
    }
  }

  const ordered = orderGroups([...groups.values()], view, areas, projects);
  if (unassigned.length > 0) {
    ordered.push({ key: 'unassigned', label: view === 'project' ? 'Sem projeto' : 'Sem área', tasks: unassigned });
  }
  return ordered;
}

function orderGroups(groups: TaskGroup[], view: TaskOrganizationView, areas: Area[], projects: Project[]): TaskGroup[] {
  const rank = new Map<string, number>();
  if (view === 'area') areas.forEach((area, index) => rank.set(area.id, index));
  else if (view === 'project') projects.forEach((project, index) => rank.set(project.id, index));
  else {
    let index = 0;
    for (const area of areas) {
      for (const project of projects) {
        if (project.areaId === area.id) rank.set(`${area.id}/${project.id}`, index++);
      }
    }
  }
  return groups.sort((a, b) => (rank.get(a.key) ?? Infinity) - (rank.get(b.key) ?? Infinity));
}

export type AreaDetailView = 'overview' | 'projects' | 'project';
export type ProjectTab = 'overview' | 'tasks';
/** Which pane a single-column (compact) layout shows. */
export type AreasPane = 'list' | 'detail';

export interface AreasWorkspaceState {
  areaId: string | null;
  view: AreaDetailView;
  projectId: string | null;
  projectTab: ProjectTab;
  /** Task opened from a Project; independent from the Tasks tab selection. */
  taskId: string | null;
  pane: AreasPane;
}

export interface ResolvedAreasWorkspace {
  area: Area | null;
  view: AreaDetailView;
  project: Project | null;
  projectTab: ProjectTab;
  projectTasks: Task[];
  task: Task | null;
  /** Without Areas the list is empty, so compact layouts show the detail's empty state. */
  pane: AreasPane;
}

/**
 * Resolves stored ids against current data so deleted or synced-away records
 * fall back to a valid screen without effects in the views.
 */
export function resolveAreasWorkspace(
  state: AreasWorkspaceState,
  areas: Area[],
  projects: Project[],
  tasks: Task[],
): ResolvedAreasWorkspace {
  const area = areas.find((item) => item.id === state.areaId) ?? areas[0] ?? null;
  const project = area && state.view === 'project'
    ? projects.find((item) => item.id === state.projectId && item.areaId === area.id) ?? null
    : null;
  const view: AreaDetailView = state.view === 'project' && !project ? 'overview' : state.view;
  const projectTasks = project ? selectProjectTasks(tasks, project.id) : [];
  // Archived tasks may stay open so the detail panel can offer undo.
  const task = project && state.taskId
    ? tasks.find((item) => item.id === state.taskId && item.projectId === project.id) ?? null
    : null;

  return { area, view, project, projectTab: state.projectTab, projectTasks, task, pane: area ? state.pane : 'detail' };
}
