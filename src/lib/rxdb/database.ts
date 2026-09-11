/**
 * RxDB database factory (infrastructure layer).
 * Creates the local-first database backed by IndexedDB (via Dexie), with one
 * collection per synced entity. The Supabase replication plugin then keeps
 * each collection in sync with the matching Postgres table.
 *
 * The database is created lazily and cached; call `initRxDb()` once during
 * app boot (see src/utils/initStores.ts).
 *
 * Because Dexie wraps IndexedDB, we get a storage ceiling in the hundreds of
 * MB to GB, far beyond localStorage's ~5MB, with no extra setup cost.
 */

import { createRxDatabase, type RxDatabase, type RxCollection } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateSupabase, type RxSupabaseReplicationState } from 'rxdb/plugins/replication-supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  TASK_SCHEMA,
  SUBTASK_SCHEMA,
  SETTINGS_SCHEMA,
  PROFILE_SCHEMA,
  type TaskDoc as TaskDocType,
  type SubtaskDoc as SubtaskDocType,
  type SettingsDoc as SettingsDocType,
  type ProfileDoc as ProfileDocType,
} from './schema';

export type TaskDoc = TaskDocType;
export type SubtaskDoc = SubtaskDocType;
export type SettingsDoc = SettingsDocType;
export type ProfileDoc = ProfileDocType;

export interface RxCollections {
  tasks: RxCollection<TaskDoc>;
  subtasks: RxCollection<SubtaskDoc>;
  settings: RxCollection<SettingsDoc>;
  profile: RxCollection<ProfileDoc>;
}

/**
 * A live replication state, so the app can start/stop replication when the
 * user signs in / out.
 */
export interface ReplicationHandle {
  tasks: RxSupabaseReplicationState<TaskDoc>;
  subtasks: RxSupabaseReplicationState<SubtaskDoc>;
  settings: RxSupabaseReplicationState<SettingsDoc>;
  profile: RxSupabaseReplicationState<ProfileDoc>;
}

const FIELD_NAMES = [
  ['accountId', 'account_id'],
  ['createdBy', 'created_by'],
  ['projectId', 'project_id'],
  ['assigneeId', 'assignee_id'],
  ['createdAt', 'created_at'],
  ['scheduledDate', 'scheduled_date'],
  ['taskId', 'task_id'],
  ['themeId', 'theme_id'],
  ['customPalette', 'custom_palette'],
  ['fontId', 'font_id'],
  ['fontScale', 'font_scale'],
  ['showProgressBars', 'show_progress_bars'],
  ['reduceMotion', 'reduce_motion'],
  ['soundEnabled', 'sound_enabled'],
  ['celebrationsEnabled', 'celebrations_enabled'],
] as const;

function mapFields<T extends object>(
  document: T,
  direction: 'toServer' | 'toLocal',
): T {
  const mapped = { ...document } as Record<string, unknown>;
  for (const [localName, serverName] of FIELD_NAMES) {
    const source = direction === 'toServer' ? localName : serverName;
    const target = direction === 'toServer' ? serverName : localName;
    if (source in mapped) {
      mapped[target] = mapped[source];
      delete mapped[source];
    }
  }
  return mapped as T;
}

function toLocalDocument<T extends object>(document: T): T {
  return mapFields(document, 'toLocal');
}

function toServerDocument<T extends object>(document: T): T {
  return mapFields(document, 'toServer');
}

let dbPromise: Promise<RxDatabase<RxCollections>> | null = null;
let cachedDb: RxDatabase<RxCollections> | null = null;

export function getRxDb(): Promise<RxDatabase<RxCollections>> {
  if (cachedDb) return Promise.resolve(cachedDb);
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const db = await createRxDatabase<RxCollections>({
      name: 'tarefitas',
      storage: getRxStorageDexie(),
      multiInstance: true,
    });

    await db.addCollections<RxCollections>({
      tasks: { schema: TASK_SCHEMA },
      subtasks: { schema: SUBTASK_SCHEMA },
      settings: { schema: SETTINGS_SCHEMA },
      profile: { schema: PROFILE_SCHEMA },
    });

    cachedDb = db;
    return db;
  })();

  return dbPromise;
}

/**
 * Start two-way replication for every collection against the given Supabase
 * account (the signed-in user). Returns a handle you can `.cancel()` later.
 *
 * The plugin handles checkpointed incremental pulls, push with optimistic
 * concurrency guards, deletion tombstones, and live Realtime updates — so the
 * app does not implement any sync logic itself.
 */
export async function startReplication(
  supabase: SupabaseClient,
  accountId: string
): Promise<ReplicationHandle> {
  const db = await getRxDb();
  const baseId = `supabase-${accountId}`;
  const replicationOptions = {
    client: supabase,
    live: true,
    pull: {
      batchSize: 100,
      queryBuilder: ({ query }: { query: any }) => query.eq('account_id', accountId),
      modifier: toLocalDocument,
    },
    push: { batchSize: 100, modifier: toServerDocument },
  };

  const tasks = replicateSupabase<TaskDoc>({
    replicationIdentifier: `${baseId}-tasks`,
    tableName: 'tasks',
    collection: db.tasks,
    ...replicationOptions,
  });
  const subtasks = replicateSupabase<SubtaskDoc>({
    replicationIdentifier: `${baseId}-subtasks`,
    tableName: 'subtasks',
    collection: db.subtasks,
    ...replicationOptions,
  });
  const settings = replicateSupabase<SettingsDoc>({
    replicationIdentifier: `${baseId}-settings`,
    tableName: 'settings',
    collection: db.settings,
    ...replicationOptions,
  });
  const profile = replicateSupabase<ProfileDoc>({
    replicationIdentifier: `${baseId}-profile`,
    tableName: 'profile',
    collection: db.profile,
    ...replicationOptions,
  });

  return { tasks, subtasks, settings, profile };
}
