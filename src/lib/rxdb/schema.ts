/**
 * RxDB collection schemas.
 *
 * These mirror the Supabase tables used by the RxDB-Supabase replication
 * plugin (see src/lib/rxdb/schema.sql). Each collection:
 * - has a string primary key that matches the Supabase primary key
 * - carries `_modified` (string ISO timestamp) and `_deleted` (boolean),
 *   which the replication plugin manages automatically
 * - is scoped to an account via the `accountId` field (RLS on the server)
 *
 * `additionalProperties: false` is intentionally NOT set: Supabase rows may
 * include columns the local schema does not model, and the plugin maps
 * `_deleted`/`_modified` for us.
 */

import type { RxJsonSchema } from "rxdb";

export interface TaskDoc {
  id: string;
  accountId: string;
  createdBy?: string;
  projectId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  createdAt: string; // ISO-8601
  order: number;
  archived: boolean;
  completed?: boolean;
  scheduledDate?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  recurring?: string | null; // JSON string of recurring config
  _modified: string;
  _deleted: boolean;
}

export interface SubtaskDoc {
  id: string;
  accountId: string;
  taskId: string;
  title: string;
  description?: string;
  done: boolean;
  order: number;
  _modified: string;
  _deleted: boolean;
}

export interface AreaDoc {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  createdAt: string;
  _modified: string;
  _deleted: boolean;
}

export interface ProjectDoc {
  id: string;
  accountId: string;
  areaId?: string;
  ownerId?: string;
  createdBy?: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  _modified: string;
  _deleted: boolean;
}

export interface SettingsDoc {
  id: string;
  accountId: string;
  themeId: string;
  customPalette: string; // JSON string of CustomPalette
  fontId: string;
  fontScale: string;
  density: string;
  showProgressBars: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  celebrationsEnabled: boolean;
  pomodoro: string; // JSON string of pomodoro settings
  _modified: string;
  _deleted: boolean;
}

export interface ProfileDoc {
  id: string;
  accountId: string;
  name: string;
  _modified: string;
  _deleted: boolean;
}

export interface DraftDoc {
  id: string;
  accountId: string;
  data: string;
  updatedAt: string;
}

export const TASK_SCHEMA: RxJsonSchema<TaskDoc> = {
  version: 3,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    createdBy: { type: "string" },
    projectId: { type: "string" },
    assigneeId: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    createdAt: { type: "string" },
    order: { type: "number" },
    archived: { type: "boolean" },
    completed: { type: "boolean" },
    scheduledDate: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    recurring: { type: ["string", "null"] },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: [
    "id",
    "accountId",
    "title",
    "createdAt",
    "order",
    "archived",
    "_modified",
    "_deleted",
  ],
  indexes: ["accountId"],
};

export const AREA_SCHEMA: RxJsonSchema<AreaDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    color: { type: "string" },
    order: { type: "number" },
    createdAt: { type: "string" },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: [
    "id",
    "accountId",
    "name",
    "order",
    "createdAt",
    "_modified",
    "_deleted",
  ],
  indexes: ["accountId"],
};

export const PROJECT_SCHEMA: RxJsonSchema<ProjectDoc> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    areaId: { type: "string" },
    ownerId: { type: "string" },
    createdBy: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "accountId", "name", "createdAt", "_modified", "_deleted"],
  indexes: ["accountId"],
};

export const SUBTASK_SCHEMA: RxJsonSchema<SubtaskDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    taskId: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    done: { type: "boolean" },
    order: { type: "number" },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: [
    "id",
    "accountId",
    "taskId",
    "title",
    "done",
    "order",
    "_modified",
    "_deleted",
  ],
  indexes: ["accountId", "taskId"],
};

export const SETTINGS_SCHEMA: RxJsonSchema<SettingsDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    themeId: { type: "string" },
    customPalette: { type: "string" },
    fontId: { type: "string" },
    fontScale: { type: "string" },
    density: { type: "string" },
    showProgressBars: { type: "boolean" },
    reduceMotion: { type: "boolean" },
    soundEnabled: { type: "boolean" },
    celebrationsEnabled: { type: "boolean" },
    pomodoro: { type: "string" },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "accountId", "_modified", "_deleted"],
  indexes: ["accountId"],
};

export const PROFILE_SCHEMA: RxJsonSchema<ProfileDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    name: { type: "string" },
    _modified: { type: "string" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "accountId", "name", "_modified", "_deleted"],
  indexes: ["accountId"],
};

export const DRAFT_SCHEMA: RxJsonSchema<DraftDoc> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    accountId: { type: "string" },
    data: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: ["id", "accountId", "data", "updatedAt"],
};
