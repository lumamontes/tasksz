import { describe, expect, it } from 'vitest';
import type { Area, Project, Task } from '../../types';
import { countTasksInProjects, planAreaDeletion, planProjectsDeletion, summarizeAreaDeletion } from './deletion';

const now = new Date();
const area = (id: string): Area => ({ id, name: id, order: 0, createdAt: now, updatedAt: now });
const project = (id: string, areaId?: string): Project => ({ id, name: id, areaId, createdAt: now, updatedAt: now });
const task = (id: string, projectId?: string): Task => ({ id, title: id, projectId, order: 0, archived: false, createdAt: now, updatedAt: now });

const areas = [area('work'), area('home')];
const projects = [project('site', 'work'), project('app', 'work'), project('garden', 'home')];
const tasks = [task('t-site', 'site'), task('t-app', 'app'), task('t-garden', 'garden'), task('t-personal')];

describe('project deletion', () => {
  it('keeps tasks without a project by default choice', () => {
    expect(planProjectsDeletion(['site'], { deleteTasks: false }, tasks)).toEqual({
      projectIds: ['site'],
      deleteTaskIds: [],
      unassignTaskIds: ['t-site'],
    });
  });

  it('deletes the tasks when asked', () => {
    expect(planProjectsDeletion(['site'], { deleteTasks: true }, tasks).deleteTaskIds).toEqual(['t-site']);
  });
});

describe('deletion summaries', () => {
  it('summarizes what deleting an Area affects and where Projects can go', () => {
    const summary = summarizeAreaDeletion('work', areas, projects, tasks);
    expect(summary.projects.map((project) => project.id)).toEqual(['site', 'app']);
    expect(summary.taskCount).toBe(2);
    expect(summary.destinationAreas.map((area) => area.id)).toEqual(['home']);
  });

  it('counts archived tasks too, since deletion affects them', () => {
    expect(countTasksInProjects(['site'], [...tasks, { ...task('t-old', 'site'), archived: true }])).toBe(2);
  });
});

describe('area deletion', () => {
  it('deletes only the area projects and keeps their tasks unassigned', () => {
    const plan = planAreaDeletion('work', { kind: 'delete', deleteTasks: false }, areas, projects, tasks);
    expect(plan).toEqual({
      areaId: 'work',
      move: null,
      projectIds: ['site', 'app'],
      deleteTaskIds: [],
      unassignTaskIds: ['t-site', 't-app'],
    });
  });

  it('deletes the area projects and their tasks', () => {
    const plan = planAreaDeletion('work', { kind: 'delete', deleteTasks: true }, areas, projects, tasks);
    expect(plan.deleteTaskIds).toEqual(['t-site', 't-app']);
    expect(plan.unassignTaskIds).toEqual([]);
  });

  it('moves projects to another area without touching tasks', () => {
    const plan = planAreaDeletion('work', { kind: 'move', toAreaId: 'home' }, areas, projects, tasks);
    expect(plan).toEqual({
      areaId: 'work',
      move: { projectIds: ['site', 'app'], toAreaId: 'home' },
      projectIds: [],
      deleteTaskIds: [],
      unassignTaskIds: [],
    });
  });

  it('rejects moving projects to the deleted area or an unknown area', () => {
    expect(() => planAreaDeletion('work', { kind: 'move', toAreaId: 'work' }, areas, projects, tasks)).toThrow();
    expect(() => planAreaDeletion('work', { kind: 'move', toAreaId: 'gone' }, areas, projects, tasks)).toThrow();
  });
});
