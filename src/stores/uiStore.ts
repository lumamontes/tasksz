/**
 * UI Store
 * UI state shared across islands of the tasks tab
 */

import { atom } from "nanostores";
import {
  getCurrentAccount,
  rxClearTaskDraft,
  rxLoadTaskDraft,
  rxSaveTaskDraft,
} from "../lib/rxdb/bridge";
import type { TaskDraftSnapshot } from "../types";

export type TaskFormState =
  | { mode: "new"; scheduledDate?: string; projectId?: string }
  | { mode: "edit"; taskId: string };
const emptyTaskDraft: TaskDraftSnapshot = {
  title: "",
  description: "",
  newSubtasks: [],
};
let draftWrite = Promise.resolve();

export const $taskForm = atom<TaskFormState | null>(null);
export const $taskDraft = atom<TaskDraftSnapshot | null>(null);

export function resetTaskDraftState() {
  $taskDraft.set(null);
  $taskForm.set(null);
}

export async function restoreTaskDraft() {
  const draft = await rxLoadTaskDraft();
  if (draft) {
    $taskDraft.set(draft);
    $taskForm.set({
      mode: "new",
      scheduledDate: draft.scheduledDate,
      projectId: draft.projectId,
    });
  }
}

export function updateTaskDraft(updates: Partial<TaskDraftSnapshot>) {
  const draft = { ...emptyTaskDraft, ...$taskDraft.get(), ...updates };
  $taskDraft.set(draft);
  const accountId = getCurrentAccount();
  draftWrite = draftWrite
    .then(() => rxSaveTaskDraft(draft, accountId))
    .catch(() => undefined);
}

export function clearTaskDraft() {
  $taskDraft.set(null);
  draftWrite = draftWrite.then(() => rxClearTaskDraft()).catch(() => undefined);
}

export function openNewTask(options?: {
  scheduledDate?: string;
  projectId?: string;
}) {
  const draft = $taskDraft.get();
  $taskForm.set({
    mode: "new",
    scheduledDate: options?.scheduledDate ?? draft?.scheduledDate,
    projectId: options?.projectId ?? draft?.projectId,
  });
}

export function openEditTask(taskId: string) {
  $taskForm.set({ mode: "edit", taskId });
}

export function closeTaskForm() {
  $taskForm.set(null);
}
