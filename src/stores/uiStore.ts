/**
 * UI Store
 * UI state shared across islands of the tasks tab
 */

import { atom } from 'nanostores';

export type TaskFormState = { mode: 'new'; scheduledDate?: string } | { mode: 'edit'; taskId: string };

export const $taskForm = atom<TaskFormState | null>(null);

export type TaskOrganizationNavigation = { areaId?: string; projectId?: string };
export const $taskOrganizationNavigation = atom<TaskOrganizationNavigation | null>(null);

export function openNewTask(options?: { scheduledDate?: string }) {
  $taskForm.set({ mode: 'new', scheduledDate: options?.scheduledDate });
}

export function openEditTask(taskId: string) {
  $taskForm.set({ mode: 'edit', taskId });
}

export function closeTaskForm() {
  $taskForm.set(null);
}

export function openTaskOrganization(navigation: TaskOrganizationNavigation) {
  $taskOrganizationNavigation.set(navigation);
}
