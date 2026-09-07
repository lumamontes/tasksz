/**
 * RxDB ↔ Nanostores bridge (application layer).
 *
 * Keeps the existing Nanostores atoms as the reactive facade so all
 * components keep working unchanged, while data lives in RxDB (IndexedDB via
 * Dexie) and is replicated to Supabase by the replication plugin.
 *
 * Data flow:
 *   mutate → store action → RxDB write → RxDB `find().$` → atom.set() → UI
 *   sync   → Supabase pull/Realtime → RxDB write → RxDB `find().$` → atom
 *
 * This module is intentionally the only place that knows about both RxDB
 * collections and the app's domain shapes.
 */

import { $tasks, $subtasks } from '../../stores/tasksStore';
import { $settings } from '../../stores/settingsStore';
import { $user } from '../../stores/userStore';
import { getRxDb } from './database';
import type { Task, Subtask } from '../../types';
import type { SettingsState, CustomPalette } from '../../stores/settingsStore';
import type { UserState } from '../../stores/userStore';
import type {
  TaskDoc,
  SubtaskDoc,
  SettingsDoc,
  ProfileDoc,
} from './database';

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The account id currently writing to Supabase (auth user id). Set when a
 * user signs in; guests write with a blank accountId so their data stays
 * device-local until they sign up/sign in (at which point replication
 * re-keys existing rows for the account).
 */
let currentAccountId = '';
export function setCurrentAccount(accountId: string): void {
  currentAccountId = accountId;
}
export function getCurrentAccount(): string {
  return currentAccountId;
}

/**
 * Re-key every local row to a given account so guest-created data becomes
 * syncable. Used on sign-in so pre-account work is uploaded rather than
 * lost. No-op floor for settings/profile is fine: they are upserted by id.
 */
export async function rekeyToAccount(accountId: string): Promise<void> {
  setCurrentAccount(accountId);
  const db = await getRxDb();

  const [tasks, subtasks, settings, profiles] = await Promise.all([
    db.tasks.find().exec(),
    db.subtasks.find().exec(),
    db.settings.find().exec(),
    db.profile.find().exec(),
  ]);

  await Promise.all([
    db.tasks.bulkUpsert(
      tasks.map((t) => ({ ...t.toJSON(), accountId, _modified: nowIso() }))
    ),
    db.subtasks.bulkUpsert(
      subtasks.map((s) => ({ ...s.toJSON(), accountId, _modified: nowIso() }))
    ),
    db.settings.bulkUpsert(
      settings.map((s) => ({ ...s.toJSON(), accountId, _modified: nowIso() }))
    ),
    db.profile.bulkUpsert(
      profiles.map((p) => ({ ...p.toJSON(), accountId, _modified: nowIso() }))
    ),
  ]);
}

// ---- Domain → doc mapping -------------------------------------------------

function taskToDoc(task: Task): Omit<TaskDoc, 'accountId' | '_modified' | '_deleted'> {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? '',
    createdAt: task.createdAt.toISOString(),
    order: task.order,
    archived: task.archived,
    scheduledDate: task.scheduledDate ?? undefined,
    recurring: task.recurring ? JSON.stringify(task.recurring) : null,
  };
}

function docToTask(doc: TaskDoc): Task {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description ? String(doc.description) : undefined,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc._modified ?? Date.now()),
    order: doc.order,
    archived: doc.archived,
    scheduledDate: doc.scheduledDate ?? undefined,
    recurring: doc.recurring ? (JSON.parse(doc.recurring) as Task['recurring']) : undefined,
  };
}

function subtaskToDoc(subtask: Subtask): Omit<SubtaskDoc, 'accountId' | '_modified' | '_deleted'> {
  return {
    id: subtask.id,
    taskId: subtask.taskId,
    title: subtask.title,
    description: subtask.description ?? '',
    done: subtask.done,
    order: subtask.order,
  };
}

function docToSubtask(doc: SubtaskDoc): Subtask {
  return {
    id: doc.id,
    taskId: doc.taskId,
    title: doc.title,
    description: doc.description ? String(doc.description) : undefined,
    done: doc.done,
    order: doc.order,
    updatedAt: new Date(doc._modified ?? Date.now()),
  };
}

function settingsToDoc(settings: SettingsState): Omit<SettingsDoc, 'id' | 'accountId' | '_modified' | '_deleted'> {
  return {
    themeId: settings.themeId,
    customPalette: JSON.stringify(settings.customPalette),
    fontId: settings.fontId,
    fontScale: settings.fontScale,
    density: settings.density,
    showProgressBars: settings.showProgressBars,
    reduceMotion: settings.reduceMotion,
    soundEnabled: settings.soundEnabled,
    celebrationsEnabled: settings.celebrationsEnabled,
    pomodoro: JSON.stringify(settings.pomodoro),
  };
}

const DEFAULT_PALETTE: CustomPalette = {
  bg: '#f8f7f4',
  panel: '#ffffff',
  sidebar: '#fefefe',
  text: '#2d3436',
  mutedText: '#636e72',
  accent: '#6c5ce7',
  border: '#dfe6e9',
};

function docToSettings(doc: SettingsDoc): SettingsState {
  let palette = DEFAULT_PALETTE;
  try {
    palette = doc.customPalette ? (JSON.parse(doc.customPalette) as CustomPalette) : DEFAULT_PALETTE;
  } catch {
    palette = DEFAULT_PALETTE;
  }

  let pomodoro = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 };
  try {
    if (doc.pomodoro) pomodoro = JSON.parse(doc.pomodoro);
  } catch {
    // keep default
  }

  return {
    themeId: (doc.themeId as SettingsState['themeId']) ?? 'calm-beige',
    customPalette: palette,
    fontId: (doc.fontId as SettingsState['fontId']) ?? 'system',
    fontScale: (doc.fontScale as SettingsState['fontScale']) ?? 'md',
    density: (doc.density as SettingsState['density']) ?? 'cozy',
    showProgressBars: Boolean(doc.showProgressBars),
    reduceMotion: Boolean(doc.reduceMotion),
    soundEnabled: Boolean(doc.soundEnabled),
    celebrationsEnabled: Boolean(doc.celebrationsEnabled),
    pomodoro,
  };
}

function profileToDoc(user: UserState): Omit<ProfileDoc, 'id' | 'accountId' | '_modified' | '_deleted'> {
  return { name: user.profile?.name ?? '' };
}

function docToProfile(doc: ProfileDoc): UserState {
  const name = String(doc.name ?? '').trim();
  return {
    status: name ? 'authenticated' : 'anonymous',
    profile: name ? { name, provider: 'local' as const } : null,
  };
}

// ---- Watch RxDB → atoms ---------------------------------------------------

/**
 * Subscribe to every collection's RxDB query observable and push results into
 * the Nanostores atoms. Run once after the database is created.
 */
export async function watchRxDbToAtoms(): Promise<() => void> {
  const db = await getRxDb();
  const subs: Array<{ unsubscribe(): void }> = [];

  subs.push(
    db.tasks.find().$.subscribe((docs) => $tasks.set(docs.map(docToTask)))
  );
  subs.push(
    db.subtasks.find().$.subscribe((docs) => $subtasks.set(docs.map(docToSubtask)))
  );
  subs.push(
    db.settings.findOne().$.subscribe((doc) => {
      if (doc) $settings.set(docToSettings(doc));
    })
  );
  subs.push(
    db.profile.findOne().$.subscribe((doc) => {
      if (doc) $user.set(docToProfile(doc));
    })
  );

  return () => subs.forEach((s) => s.unsubscribe());
}

// ---- CRUD helpers (used by store actions) ---------------------------------

export async function rxInsertTask(task: Task): Promise<void> {
  const db = await getRxDb();
  await db.tasks.upsert({
    ...taskToDoc(task),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateTask(id: string, updated: Task): Promise<void> {
  const db = await getRxDb();
  const existing = await db.tasks.findOne({ selector: { id } }).exec();
  const doc = {
    ...taskToDoc(updated),
    id,
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  };
  await db.tasks.upsert(doc);
}

export async function rxRemoveTask(id: string): Promise<void> {
  const db = await getRxDb();
  const doc = await db.tasks.findOne({ selector: { id } }).exec();
  if (doc) await doc.remove();
}

export async function rxInsertSubtask(subtask: Subtask): Promise<void> {
  const db = await getRxDb();
  await db.subtasks.upsert({
    ...subtaskToDoc(subtask),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateSubtask(id: string, updated: Subtask): Promise<void> {
  const db = await getRxDb();
  const existing = await db.subtasks.findOne({ selector: { id } }).exec();
  const doc = {
    ...subtaskToDoc(updated),
    id,
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  };
  await db.subtasks.upsert(doc);
}

export async function rxRemoveSubtask(id: string): Promise<void> {
  const db = await getRxDb();
  const doc = await db.subtasks.findOne({ selector: { id } }).exec();
  if (doc) await doc.remove();
}

export async function rxSaveSettings(settings: SettingsState): Promise<void> {
  const db = await getRxDb();
  const existing = await db.settings.findOne().exec();
  await db.settings.upsert({
    id: existing?.id ?? 'default',
    ...settingsToDoc(settings),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxSaveProfile(user: UserState): Promise<void> {
  const db = await getRxDb();
  const existing = await db.profile.findOne().exec();
  await db.profile.upsert({
    id: existing?.id ?? 'default',
    ...profileToDoc(user),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
}

// ---- Bulk operations (data backup import / full reset) --------------------

export interface BackupPayload {
  tasks?: Task[];
  subtasks?: Subtask[];
  settings?: SettingsState;
}

/**
 * Replace every synced collection with the contents of a backup.
 * The existing docs are removed first so the imported data fully takes over.
 */
export async function rxImportBackup(data: BackupPayload): Promise<void> {
  const db = await getRxDb();

  await Promise.all([
    db.tasks.find().remove(),
    db.subtasks.find().remove(),
    db.settings.find().remove(),
    db.profile.find().remove(),
  ]);

  if (data.tasks?.length) {
    await db.tasks.bulkUpsert(
      data.tasks.map((t) => ({
        ...taskToDoc(t),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.subtasks?.length) {
    await db.subtasks.bulkUpsert(
      data.subtasks.map((s) => ({
        ...subtaskToDoc(s),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.settings) {
    await db.settings.upsert({
      id: 'default',
      ...settingsToDoc(data.settings),
      accountId: getCurrentAccount(),
      _modified: nowIso(),
      _deleted: false,
    });
  }
}

/**
 * Remove every document from all collections (used by "apagar todos os dados").
 */
export async function rxClearAllData(): Promise<void> {
  const db = await getRxDb();
  await Promise.all([
    db.tasks.find().remove(),
    db.subtasks.find().remove(),
    db.settings.find().remove(),
    db.profile.find().remove(),
  ]);
}

// ---- Migration from localStorage ------------------------------------------

/**
 * Seed RxDB collections from the legacy localStorage blob (if present), then
 * remove the legacy key so the old persistence layer stops writing there.
 */
export async function migrateLocalStorageToRxDb(): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await getRxDb();
  const KEY = 'tarefitas_v1_data';

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;

    const data = JSON.parse(raw) as {
      tasks?: any[];
      subtasks?: any[];
      settings?: any;
      user?: any;
    };

    if (data.tasks?.length) {
      await db.tasks.bulkUpsert(
        data.tasks.map((t) => ({ ...taskToDoc(t), accountId: getCurrentAccount(), _modified: nowIso(), _deleted: false }))
      );
    }
    if (data.subtasks?.length) {
      await db.subtasks.bulkUpsert(
        data.subtasks.map((s) => ({ ...subtaskToDoc(s), accountId: getCurrentAccount(), _modified: nowIso(), _deleted: false }))
      );
    }
    if (data.settings) {
      await db.settings.upsert({
        id: 'default',
        ...settingsToDoc(data.settings),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      });
    }
    if (data.user?.profile?.name) {
      await db.profile.upsert({
        id: 'default',
        name: String(data.user.profile.name),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      });
    }

    localStorage.removeItem(KEY);
  } catch (err) {
    console.warn('RxDB localStorage migration failed:', err);
  }
}