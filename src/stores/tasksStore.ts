/**
 * Tasks and Subtasks Store
 * Manages tasks, subtasks, and selected task state
 *
 * Data lives in RxDB (IndexedDB via Dexie) and syncs to Supabase; the atoms
 * below are the reactive facade made available to components. Mutations write
 * through the RxDB bridge, and the bridge's collection observables update the
 * atoms so the UI always reflects the local-first source of truth.
 */

import { atom, computed } from 'nanostores';
import type { Task, Subtask } from '../types';
import { getTodayString, isValidDateString, parseDateLocal } from '../utils/dateUtils';
import { trackEvent } from '../utils/analytics';
import {
  rxInsertTask,
  rxUpdateTask,
  rxRemoveTask,
  rxInsertSubtask,
  rxUpdateSubtask,
  rxRemoveSubtask,
  rxRemoveSubtasksForTask,
} from '../lib/rxdb/bridge';
import { isTaskCompletedValue } from '../domain/tasks/completion';

// Core state atoms
export const $tasks = atom<Task[]>([]);
export const $subtasks = atom<Subtask[]>([]);
export const $selectedTaskId = atom<string | null>(null);
export const $selectedDay = atom<string>(getTodayString());
export type TaskFilter = 'all' | 'in-progress' | 'completed' | 'archived';
export const $taskFilter = atom<TaskFilter>('all');

// Computed values
export const $selectedTask = computed([$tasks, $selectedTaskId], (tasks, selectedId) => {
  if (!selectedId) return null;
  return tasks.find(task => task.id === selectedId) || null;
});

export const $selectedTaskSubtasks = computed([$subtasks, $selectedTaskId], (subtasks, selectedId) => {
  if (!selectedId) return [];
  return subtasks
    .filter(subtask => subtask.taskId === selectedId)
    .sort((a, b) => a.order - b.order);
});

export const $taskProgress = computed([$selectedTaskSubtasks], (subtasks) => {
  if (subtasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  const completed = subtasks.filter(s => s.done).length;
  const total = subtasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
});

// Get progress for a specific task
export function getTaskProgress(taskId: string) {
  const subtasks = $subtasks.get();
  const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
  if (taskSubtasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  const completed = taskSubtasks.filter(s => s.done).length;
  const total = taskSubtasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

/** Keeps legacy tasks compatible while giving new tasks an explicit state. */
export function isTaskCompleted(taskId: string, task?: Task, subtasks = $subtasks.get()): boolean {
  return isTaskCompletedValue(task, subtasks.filter((subtask) => subtask.taskId === taskId));
}

// Whether a task belongs to a given day (scheduled date or recurring match)
function matchesDay(task: Task, dateStr: string): boolean {
  if (task.scheduledDate === dateStr) return true;

  if (task.startDate || task.endDate) {
    const start = task.startDate || task.endDate;
    const end = task.endDate || task.startDate;
    if (start && end && dateStr >= start && dateStr <= end) return true;
  }

  if (task.recurring) {
    if (task.recurring.type === 'daily') return true;
    if (task.recurring.type === 'weekly' && task.recurring.daysOfWeek) {
      const dayOfWeek = parseDateLocal(dateStr).getDay();
      return task.recurring.daysOfWeek.includes(dayOfWeek);
    }
  }

  return false;
}

// Filtered tasks based on selected day + current filter
export const $filteredTasks = computed(
  [$tasks, $taskFilter, $subtasks, $selectedDay],
  (tasks, filter, subtasks, selectedDay) => {
    if (filter === 'archived') {
      return tasks
        .filter((task) => task.archived)
        .slice()
        .sort((a, b) => a.order - b.order);
    }

    const dayTasks = tasks.filter((task) => {
      if (task.archived) return false;
      if (matchesDay(task, selectedDay)) return true;
      // Unscheduled tasks are a rolling backlog: they stay visible on any day
      // (e.g. tasks created without a date reappear on the next day).
      return !task.scheduledDate && !task.startDate && !task.endDate && !task.recurring;
    });

    let result: Task[];
    if (filter === 'in-progress') {
      // Everything that isn't fully completed (no-subtask tasks count as active)
      result = dayTasks.filter((task) => {
        return !isTaskCompleted(task.id, task, subtasks);
      });
    } else if (filter === 'completed') {
      result = dayTasks.filter((task) => {
        return isTaskCompleted(task.id, task, subtasks);
      });
    } else {
      result = dayTasks;
    }

    return result.slice().sort((a, b) => a.order - b.order);
  }
);

// Action to set filter
export function setTaskFilter(filter: TaskFilter) {
  $taskFilter.set(filter);
}

// Action to set the selected day (YYYY-MM-DD). Invalid strings are silently ignored.
export function setSelectedDay(dateStr: string) {
  if (isValidDateString(dateStr)) {
    $selectedDay.set(dateStr);
  }
}

// Action functions
export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<string> {
  const tasks = $tasks.get();
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: tasks.length
  };
  
  await rxInsertTask(newTask);
  trackEvent('task_created', { hasDate: Boolean(task.scheduledDate) });
  return newTask.id;
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
  const tasks = $tasks.get();
  const target = tasks.find(task => task.id === id);
  if (!target) return;
  
  const updated: Task = { ...target, ...updates, updatedAt: new Date() };
  void rxUpdateTask(id, updated);
}

export function deleteTask(id: string) {
  return removeTasks([id]);
}

/** Deletes tasks with their subtasks. */
export async function removeTasks(ids: string[]) {
  await Promise.all(ids.flatMap((id) => [rxRemoveTask(id), rxRemoveSubtasksForTask(id)]));

  // Clear selection if a deleted task was selected
  const selectedId = $selectedTaskId.get();
  if (selectedId && ids.includes(selectedId)) {
    $selectedTaskId.set(null);
  }
}

/** Keeps tasks in the task list without a Project. */
export async function unassignTasksFromProject(ids: string[]) {
  const tasks = $tasks.get();
  await Promise.all(ids.map((id) => {
    const target = tasks.find((task) => task.id === id);
    return target ? rxUpdateTask(id, { ...target, projectId: undefined, updatedAt: new Date() }) : undefined;
  }));
}

// Batch actions (multi-select support)
export async function archiveTasks(ids: string[], archived: boolean) {
  const tasks = $tasks.get();
  await Promise.all(ids.map((id) => {
    const target = tasks.find(task => task.id === id);
    return target ? rxUpdateTask(id, { ...target, archived, updatedAt: new Date() }) : undefined;
  }));
}

export function setTasksScheduledDate(ids: string[], date?: string) {
  const tasks = $tasks.get();
  for (const id of ids) {
    const target = tasks.find(task => task.id === id);
    if (target) {
      void rxUpdateTask(id, {
        ...target,
        scheduledDate: date || undefined,
        recurring: undefined,
        updatedAt: new Date()
      });
    }
  }
}

export function selectTask(id: string | null) {
  $selectedTaskId.set(id);
}

export function reorderTasks(reorderedTasks: Task[]) {
  for (let index = 0; index < reorderedTasks.length; index++) {
    const task = reorderedTasks[index];
    if (task.order === index) continue;
    void rxUpdateTask(task.id, { ...task, order: index, updatedAt: new Date() });
  }
}

// Subtask actions
export function addSubtask(taskId: string, title: string, order?: number) {
  const subtasks = $subtasks.get();
  const existingSubtasks = subtasks.filter(s => s.taskId === taskId);
  
  const newSubtask: Subtask = {
    id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskId,
    title,
    done: false,
    order: order ?? existingSubtasks.length,
    updatedAt: new Date()
  };
  
  void rxInsertSubtask(newSubtask);
  return newSubtask.id;
}

export function updateSubtask(id: string, updates: Partial<Omit<Subtask, 'id' | 'taskId'>>) {
  const subtasks = $subtasks.get();
  const target = subtasks.find(subtask => subtask.id === id);
  if (!target) return;
  
  void rxUpdateSubtask(id, { ...target, ...updates, updatedAt: new Date() });
}

export function deleteSubtask(id: string) {
  return rxRemoveSubtask(id);
}

export function toggleSubtaskDone(id: string) {
  const subtasks = $subtasks.get();
  const targetSubtask = subtasks.find(s => s.id === id);
  if (!targetSubtask) return;
  
  void rxUpdateSubtask(id, {
    ...targetSubtask,
    done: !targetSubtask.done,
    updatedAt: new Date()
  });
  
  // Trigger ND celebration system if subtask was completed
  if (targetSubtask && !targetSubtask.done) {
    trackEvent('subtask_completed');
    // Import dynamically to avoid circular dependency
    if (typeof window !== 'undefined') {
      import('./ndStore').then(({ recordTaskCompletion }) => {
        recordTaskCompletion(targetSubtask.taskId);
      });
    }
  }
}

/** Completes the task as a whole and keeps its subtasks visually consistent. */
export function toggleTaskCompleted(taskId: string) {
  const task = $tasks.get().find((item) => item.id === taskId);
  if (!task) return;

  const nextCompleted = !isTaskCompleted(taskId, task);
  updateTask(taskId, { completed: nextCompleted });

  const subtasks = $subtasks.get().filter((subtask) => subtask.taskId === taskId);
  for (const subtask of subtasks) {
    if (subtask.done !== nextCompleted) {
      void rxUpdateSubtask(subtask.id, { ...subtask, done: nextCompleted, updatedAt: new Date() });
    }
  }
}

export function reorderSubtasks(taskId: string, reorderedSubtasks: Subtask[]) {
  for (let index = 0; index < reorderedSubtasks.length; index++) {
    const subtask = reorderedSubtasks[index];
    if (subtask.order === index) continue;
    void rxUpdateSubtask(subtask.id, { ...subtask, order: index, updatedAt: new Date() });
  }
}

// Calendar query functions
/**
 * Get tasks for a specific date (YYYY-MM-DD format)
 * Includes both scheduled tasks and recurring tasks that match the date
 */
export function getTasksForDate(dateStr: string): Task[] {
  const tasks = $tasks.get();
  // Parse date string to get day of week (0 = Sunday, 6 = Saturday)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  return tasks.filter(task => {
    if (task.archived) return false;
    
    // Check if task is scheduled for this specific date
    if (task.scheduledDate === dateStr) {
      return true;
    }

    const rangeStart = task.startDate || task.endDate;
    const rangeEnd = task.endDate || task.startDate;
    if (rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd) return true;
    
    // Check if task is recurring and matches this date
    if (task.recurring) {
      if (task.recurring.type === 'daily') {
        return true; // Daily tasks appear every day
      } else if (task.recurring.type === 'weekly' && task.recurring.daysOfWeek) {
        return task.recurring.daysOfWeek.includes(dayOfWeek);
      }
    }
    
    return false;
  });
}

/**
 * Get count of tasks for a specific date (for calendar grid indicators)
 */
export function getTaskCountForDate(dateStr: string): number {
  return getTasksForDate(dateStr).length;
}

/**
 * Check if a date has any tasks (for calendar grid indicators)
 */
export function hasTasksForDate(dateStr: string): boolean {
  return getTaskCountForDate(dateStr) > 0;
}

/**
 * Get scheduled tasks for a specific date (not recurring)
 */
export function getScheduledTasksForDate(dateStr: string): Task[] {
  const tasks = $tasks.get();
  return tasks.filter(task => 
    !task.archived && 
    task.scheduledDate === dateStr &&
    !task.recurring
  );
}

/**
 * Get recurring tasks that match a specific date
 */
export function getRecurringTasksForDate(dateStr: string): Task[] {
  const tasks = $tasks.get();
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  return tasks.filter(task => {
    if (task.archived || !task.recurring) return false;
    
    if (task.recurring.type === 'daily') {
      return true;
    } else if (task.recurring.type === 'weekly' && task.recurring.daysOfWeek) {
      return task.recurring.daysOfWeek.includes(dayOfWeek);
    }
    
    return false;
  });
}

/**
 * Get recurring tasks for a specific weekday (0-6, Sunday-Saturday)
 */
export function getRecurringTasksForWeekday(weekday: number): Task[] {
  const tasks = $tasks.get();
  return tasks.filter(task => {
    if (task.archived || !task.recurring) return false;
    
    if (task.recurring.type === 'daily') {
      return true;
    } else if (task.recurring.type === 'weekly' && task.recurring.daysOfWeek) {
      return task.recurring.daysOfWeek.includes(weekday);
    }
    
    return false;
  });
}
