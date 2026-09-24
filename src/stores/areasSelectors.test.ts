import { describe, expect, it } from 'vitest';
import type { Area, Project, Task } from '../types';
import {
  areaOfTask,
  countActiveTasksByProject,
  countActiveTasksInArea,
  projectAfterAreaChange,
  countProjectsByArea,
  filterByName,
  filterTasksByOrganization,
  groupTasksByOrganization,
  resolveAreasWorkspace,
  type AreasWorkspaceState,
} from './areasSelectors';

const now = new Date();
const work: Area = { id: 'area-work', name: 'Trabalho', color: '#4f8df7', order: 0, createdAt: now, updatedAt: now };
const home: Area = { id: 'area-home', name: 'Casa', color: '#2da58a', order: 1, createdAt: now, updatedAt: now };
const site: Project = { id: 'project-site', name: 'Site', areaId: work.id, createdAt: now, updatedAt: now };
const garden: Project = { id: 'project-garden', name: 'Jardim', areaId: home.id, createdAt: now, updatedAt: now };
const legacy: Project = { id: 'project-legacy', name: 'Antigo', createdAt: now, updatedAt: now };

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: id,
  order: 0,
  archived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const workspace = (overrides: Partial<AreasWorkspaceState> = {}): AreasWorkspaceState => ({
  areaId: null,
  view: 'overview',
  projectId: null,
  projectTab: 'overview',
  taskId: null,
  pane: 'list',
  ...overrides,
});

describe('area and project counts', () => {
  it('filters by trimmed, case-insensitive name', () => {
    expect(filterByName([work, home], '  CA ')).toEqual([home]);
    expect(filterByName([work, home], '')).toEqual([work, home]);
  });

  it('counts projects per area and active tasks per project', () => {
    expect(countProjectsByArea([site, garden, legacy])).toEqual(new Map([[work.id, 1], [home.id, 1]]));
    const tasks = [task('a', { projectId: site.id }), task('b', { projectId: site.id, archived: true }), task('c')];
    expect(countActiveTasksByProject(tasks)).toEqual(new Map([[site.id, 1]]));
  });
});

describe('task area', () => {
  const projects = [site, garden];

  it('derives a task Area from its Project and counts active tasks per Area', () => {
    expect(areaOfTask(task('a', { projectId: site.id }), projects)).toBe(work.id);
    expect(areaOfTask(task('b'), projects)).toBeUndefined();
    const tasks = [task('a', { projectId: site.id }), task('b', { projectId: site.id, archived: true }), task('c', { projectId: garden.id })];
    expect(countActiveTasksInArea(work.id, projects, tasks)).toBe(1);
  });

  it('keeps the Project only when it lives in the chosen Area', () => {
    expect(projectAfterAreaChange(site.id, work.id, projects)).toBe(site.id);
    expect(projectAfterAreaChange(site.id, home.id, projects)).toBeUndefined();
    expect(projectAfterAreaChange(site.id, undefined, projects)).toBeUndefined();
  });
});

describe('task organization', () => {
  const projects = [site, garden, legacy];
  const tasks = [
    task('site-task', { projectId: site.id }),
    task('garden-task', { projectId: garden.id }),
    task('legacy-task', { projectId: legacy.id }),
    task('personal-task'),
  ];

  it('filters tasks through the project area', () => {
    expect(filterTasksByOrganization(tasks, projects, { areaId: work.id }).map((item) => item.id)).toEqual(['site-task']);
    expect(filterTasksByOrganization(tasks, projects, { projectId: garden.id }).map((item) => item.id)).toEqual(['garden-task']);
    expect(filterTasksByOrganization(tasks, projects, {})).toHaveLength(4);
  });

  it('keeps unassigned tasks visible when grouping by area', () => {
    const groups = groupTasksByOrganization('area', tasks, [work, home], projects);
    expect(groups.map((group) => [group.label, group.tasks.map((item) => item.id)])).toEqual([
      ['Trabalho', ['site-task']],
      ['Casa', ['garden-task']],
      ['Sem área', ['legacy-task', 'personal-task']],
    ]);
  });

  it('groups by project and by area and project', () => {
    expect(groupTasksByOrganization('project', tasks, [work, home], projects).map((group) => group.label)).toEqual([
      'Site', 'Jardim', 'Antigo', 'Sem projeto',
    ]);
    expect(groupTasksByOrganization('area-project', tasks, [work, home], projects).map((group) => group.label)).toEqual([
      'Trabalho / Site', 'Casa / Jardim', 'Sem área',
    ]);
  });

  it('returns a single group for the flat view', () => {
    expect(groupTasksByOrganization('flat', tasks, [work], projects)).toEqual([{ key: 'all', tasks }]);
  });
});

describe('areas workspace resolution', () => {
  const projects = [site, garden];

  it('falls back to the first area when the stored area no longer exists', () => {
    const resolved = resolveAreasWorkspace(workspace({ areaId: 'deleted' }), [work, home], projects, []);
    expect(resolved.area).toBe(work);
    expect(resolved.view).toBe('overview');
  });

  it('returns to the area overview when the open project was deleted or moved', () => {
    const deleted = resolveAreasWorkspace(workspace({ areaId: home.id, view: 'project', projectId: 'gone' }), [work, home], projects, []);
    expect(deleted).toMatchObject({ area: home, view: 'overview', project: null });

    const moved = resolveAreasWorkspace(workspace({ areaId: home.id, view: 'project', projectId: site.id }), [work, home], projects, []);
    expect(moved).toMatchObject({ area: home, view: 'overview', project: null });
  });

  it('scopes the open task to the open project, independent of the task list day', () => {
    const tasks = [
      task('later', { projectId: site.id, order: 2, scheduledDate: '2030-01-01' }),
      task('first', { projectId: site.id, order: 1 }),
      task('archived', { projectId: site.id, archived: true }),
      task('other', { projectId: garden.id }),
    ];
    const state = workspace({ areaId: work.id, view: 'project', projectId: site.id, taskId: 'later' });
    const resolved = resolveAreasWorkspace(state, [work, home], projects, tasks);

    expect(resolved.projectTasks.map((item) => item.id)).toEqual(['first', 'later']);
    expect(resolved.task?.id).toBe('later');
    expect(resolveAreasWorkspace({ ...state, taskId: 'other' }, [work, home], projects, tasks).task).toBeNull();
    expect(resolveAreasWorkspace({ ...state, taskId: 'archived' }, [work, home], projects, tasks).task?.id).toBe('archived');
  });

  it('has no area when none exist', () => {
    expect(resolveAreasWorkspace(workspace(), [], [], []).area).toBeNull();
  });

  it('shows the detail pane on compact layouts when there are no areas', () => {
    expect(resolveAreasWorkspace(workspace({ pane: 'list' }), [], [], []).pane).toBe('detail');
    expect(resolveAreasWorkspace(workspace({ pane: 'list' }), [work], [], []).pane).toBe('list');
  });
});
