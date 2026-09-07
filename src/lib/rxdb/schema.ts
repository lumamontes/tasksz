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

import type { RxJsonSchema } from 'rxdb';

export interface TaskDoc {
  id: string;
  accountId: string;
  title: string;
  description?: string;
  createdAt: string; // ISO-8601
  order: number;
  archived: boolean;
  scheduledDate?: string; // YYYY-MM-DD
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

export const TASK_SCHEMA: RxJsonSchema<TaskDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 200 },
    accountId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'string' },
    order: { type: 'number' },
    archived: { type: 'boolean' },
    scheduledDate: { type: 'string' },
    recurring: { type: ['string', 'null'] },
    _modified: { type: 'string' },
    _deleted: { type: 'boolean' },
  },
  required: ['id', 'accountId', 'title', 'createdAt', 'order', 'archived', '_modified', '_deleted'],
  indexes: ['accountId'],
};

export const SUBTASK_SCHEMA: RxJsonSchema<SubtaskDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 200 },
    accountId: { type: 'string' },
    taskId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    done: { type: 'boolean' },
    order: { type: 'number' },
    _modified: { type: 'string' },
    _deleted: { type: 'boolean' },
  },
  required: ['id', 'accountId', 'taskId', 'title', 'done', 'order', '_modified', '_deleted'],
  indexes: ['accountId', 'taskId'],
};

export const SETTINGS_SCHEMA: RxJsonSchema<SettingsDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 200 },
    accountId: { type: 'string' },
    themeId: { type: 'string' },
    customPalette: { type: 'string' },
    fontId: { type: 'string' },
    fontScale: { type: 'string' },
    density: { type: 'string' },
    showProgressBars: { type: 'boolean' },
    reduceMotion: { type: 'boolean' },
    soundEnabled: { type: 'boolean' },
    celebrationsEnabled: { type: 'boolean' },
    pomodoro: { type: 'string' },
    _modified: { type: 'string' },
    _deleted: { type: 'boolean' },
  },
  required: ['id', 'accountId', '_modified', '_deleted'],
  indexes: ['accountId'],
};

export const PROFILE_SCHEMA: RxJsonSchema<ProfileDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 200 },
    accountId: { type: 'string' },
    name: { type: 'string' },
    _modified: { type: 'string' },
    _deleted: { type: 'boolean' },
  },
  required: ['id', 'accountId', 'name', '_modified', '_deleted'],
  indexes: ['accountId'],
};