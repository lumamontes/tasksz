import { describe, expect, it } from 'vitest';
import type { Area, Project, Subtask, Task } from '../types';
import { selectAreaTaskCompletion, selectAreaTaskView } from './areasSelectors';

const area: Area = { id: 'area-1', name: 'Trabalho', order: 0, createdAt: new Date(), updatedAt: new Date() };
const project: Project = { id: 'project-1', name: 'Site', areaId: area.id, createdAt: new Date(), updatedAt: new Date() };
const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: id,
  projectId: project.id,
  order: 0,
  archived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('area selectors', () => {
  it('groups known projects while excluding archived tasks', () => {
    const view = selectAreaTaskView(area, [task('project'), task('archived', { archived: true })], [project]);

    expect(view.taskCount).toBe(1);
    expect(view.groups).toEqual([{ project, tasks: [expect.objectContaining({ id: 'project' })] }]);
  });

  it('derives new project tasks through the project area', () => {
    const view = selectAreaTaskView(area, [task('project')], [project]);

    expect(view.taskCount).toBe(1);
    expect(view.groups).toEqual([{ project, tasks: [expect.objectContaining({ id: 'project' })] }]);
  });

  it('falls back to legacy subtask completion and reports progress', () => {
    const subtasks: Subtask[] = [
      { id: 'sub-1', taskId: 'legacy', title: 'Um', done: true, order: 0, updatedAt: new Date() },
      { id: 'sub-2', taskId: 'legacy', title: 'Dois', done: false, order: 1, updatedAt: new Date() },
    ];
    expect(selectAreaTaskCompletion(task('legacy'), subtasks)).toEqual({ completed: false, progress: { completed: 1, total: 2 } });
  });
});
