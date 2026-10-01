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

import { $tasks, $subtasks } from "../../stores/tasksStore";
import { $areas } from "../../stores/areasStore";
import { $projects } from "../../stores/projectsStore";
import { $settings, defaultSettings } from "../../stores/settingsStore";
import { $user } from "../../stores/userStore";
import { getRxDb } from "./database";
import type {
  Area,
  Project,
  Task,
  Subtask,
  TaskDraftSnapshot,
} from "../../types";
import type { SettingsState, CustomPalette } from "../../stores/settingsStore";
import type { UserState } from "../../stores/userStore";
import type {
  TaskDoc,
  SubtaskDoc,
  SettingsDoc,
  ProfileDoc,
  AreaDoc,
  ProjectDoc,
} from "./database";

function nowIso(): string {
  return new Date().toISOString();
}

function toIsoDate(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function accountScopedId(
  kind: "settings" | "profile",
  accountId = getCurrentAccount(),
): string {
  return `${accountId || "guest"}:${kind}`;
}

/**
 * The account id currently writing to Supabase (auth user id). Set when a
 * user signs in; guests write with a blank accountId so their data stays
 * device-local until they sign up/sign in (at which point replication
 * re-keys existing rows for the account).
 */
let currentAccountId = "";
export function setCurrentAccount(accountId: string): void {
  if (currentAccountId === accountId) return;
  currentAccountId = accountId;
  // Do not leave the previous account's tasks visible during account changes.
  $tasks.set([]);
  $subtasks.set([]);
  $areas.set([]);
  $projects.set([]);
  $settings.set(defaultSettings);
  $user.set({ status: "anonymous", profile: null });
  void refreshRxDbToAtoms(accountId);
}
export function getCurrentAccount(): string {
  return currentAccountId;
}

/**
 * Re-key guest rows to a given account so pre-account work becomes syncable.
 * Rows already assigned to an account must never be relabeled.
 */
export async function rekeyToAccount(accountId: string): Promise<void> {
  setCurrentAccount(accountId);
  const db = await getRxDb();

  const [
    tasks,
    subtasks,
    settings,
    profiles,
    areas,
    projects,
    accountTasks,
    accountSubtasks,
    accountSettings,
    accountProfiles,
    accountAreas,
    accountProjects,
  ] = await Promise.all([
    db.tasks.find({ selector: { accountId: "" } }).exec(),
    db.subtasks.find({ selector: { accountId: "" } }).exec(),
    db.settings.find({ selector: { accountId: "" } }).exec(),
    db.profile.find({ selector: { accountId: "" } }).exec(),
    db.areas.find({ selector: { accountId: "" } }).exec(),
    db.projects.find({ selector: { accountId: "" } }).exec(),
    db.tasks.find({ selector: { accountId } }).exec(),
    db.subtasks.find({ selector: { accountId } }).exec(),
    db.settings.find({ selector: { accountId } }).exec(),
    db.profile.find({ selector: { accountId } }).exec(),
    db.areas.find({ selector: { accountId } }).exec(),
    db.projects.find({ selector: { accountId } }).exec(),
  ]);

  if (accountId !== getCurrentAccount()) return;

  const withoutAccountCollision = <T extends { id: string }>(
    guestRows: T[],
    accountRows: T[],
  ) => {
    const accountIds = new Set(accountRows.map((row) => row.id));
    return guestRows.filter((row) => !accountIds.has(row.id));
  };
  const taskCollisions = tasks.filter((task) =>
    accountTasks.some((row) => row.id === task.id),
  );
  const subtaskCollisions = subtasks.filter((subtask) =>
    accountSubtasks.some((row) => row.id === subtask.id),
  );
  const areaCollisions = areas.filter((area) =>
    accountAreas.some((row) => row.id === area.id),
  );
  const projectCollisions = projects.filter((project) =>
    accountProjects.some((row) => row.id === project.id),
  );
  const guestDraft = await db.drafts
    .findOne({ selector: { id: taskDraftId("") } })
    .exec();
  const accountDraft = await db.drafts
    .findOne({ selector: { id: taskDraftId(accountId) } })
    .exec();
  const legacyDraft = await db.drafts
    .findOne({ selector: { id: LEGACY_TASK_DRAFT_ID } })
    .exec();
  const draftToMigrate = guestDraft ?? legacyDraft;

  await Promise.all([
    db.tasks.bulkUpsert(
      withoutAccountCollision(tasks, accountTasks).map((t) => ({
        ...t.toJSON(),
        accountId,
        createdBy: t.createdBy ?? accountId,
        _modified: nowIso(),
      })),
    ),
    db.subtasks.bulkUpsert(
      withoutAccountCollision(subtasks, accountSubtasks).map((s) => ({
        ...s.toJSON(),
        accountId,
        _modified: nowIso(),
      })),
    ),
    db.settings.bulkUpsert(
      settings
        .filter(
          () =>
            !accountSettings.some(
              (row) => row.id === accountScopedId("settings", accountId),
            ),
        )
        .map((s) => ({
          ...s.toJSON(),
          id: accountScopedId("settings", accountId),
          accountId,
          _modified: nowIso(),
        })),
    ),
    db.profile.bulkUpsert(
      profiles
        .filter(
          () =>
            !accountProfiles.some(
              (row) => row.id === accountScopedId("profile", accountId),
            ),
        )
        .map((p) => ({
          ...p.toJSON(),
          id: accountScopedId("profile", accountId),
          accountId,
          _modified: nowIso(),
        })),
    ),
    db.areas.bulkUpsert(
      withoutAccountCollision(areas, accountAreas).map((area) => ({
        ...area.toJSON(),
        accountId,
        _modified: nowIso(),
      })),
    ),
    db.projects.bulkUpsert(
      withoutAccountCollision(projects, accountProjects).map((project) => ({
        ...project.toJSON(),
        accountId,
        ownerId: accountId,
        createdBy: accountId,
        _modified: nowIso(),
      })),
    ),
    !accountDraft && draftToMigrate
      ? db.drafts.upsert({
          ...draftToMigrate.toJSON(),
          id: taskDraftId(accountId),
          accountId,
          updatedAt: nowIso(),
        })
      : Promise.resolve(),
  ]);

  if (accountId !== getCurrentAccount()) return;

  // Remove guest rows after the collision-safe copy. Existing account rows win
  // instead of being overwritten by stale guest data.
  await Promise.all([
    ...taskCollisions.map((task) => task.remove()),
    ...subtaskCollisions.map((subtask) => subtask.remove()),
    ...settings.map((setting) => setting.remove()),
    ...profiles.map((profile) => profile.remove()),
    ...areaCollisions.map((area) => area.remove()),
    ...projectCollisions.map((project) => project.remove()),
    ...(guestDraft ? [guestDraft.remove()] : []),
    ...(legacyDraft ? [legacyDraft.remove()] : []),
  ]);
}

// ---- Domain → doc mapping -------------------------------------------------

function taskToDoc(
  task: Task,
  accountId = getCurrentAccount(),
): Omit<TaskDoc, "accountId" | "_modified" | "_deleted"> {
  return {
    id: task.id,
    createdBy: (task.createdBy ?? accountId) || undefined,
    projectId: task.projectId,
    assigneeId: (task.assigneeId ?? accountId) || undefined,
    title: task.title,
    description: task.description ?? "",
    createdAt: toIsoDate(task.createdAt),
    order: task.order,
    archived: task.archived,
    completed: task.completed,
    scheduledDate: task.scheduledDate ?? undefined,
    startDate: task.startDate ?? undefined,
    endDate: task.endDate ?? undefined,
    recurring: task.recurring ? JSON.stringify(task.recurring) : null,
  };
}

function docToTask(doc: TaskDoc): Task {
  return {
    id: doc.id,
    createdBy: doc.createdBy ?? undefined,
    projectId: doc.projectId ?? undefined,
    assigneeId: doc.assigneeId ?? undefined,
    title: doc.title,
    description: doc.description ? String(doc.description) : undefined,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc._modified ?? Date.now()),
    order: doc.order,
    archived: doc.archived,
    completed: doc.completed,
    scheduledDate: doc.scheduledDate ?? undefined,
    startDate: doc.startDate ?? undefined,
    endDate: doc.endDate ?? undefined,
    recurring: doc.recurring
      ? (JSON.parse(doc.recurring) as Task["recurring"])
      : undefined,
  };
}

function areaToDoc(
  area: Area,
): Omit<AreaDoc, "accountId" | "_modified" | "_deleted"> {
  return {
    id: area.id,
    name: area.name,
    description: area.description ?? "",
    color: area.color,
    order: area.order,
    createdAt: toIsoDate(area.createdAt),
  };
}

function docToArea(doc: AreaDoc): Area {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description ? String(doc.description) : undefined,
    color: doc.color ?? undefined,
    order: doc.order,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc._modified ?? Date.now()),
  };
}

function projectToDoc(
  project: Project,
  accountId = getCurrentAccount(),
): Omit<ProjectDoc, "accountId" | "_modified" | "_deleted"> {
  return {
    id: project.id,
    areaId: project.areaId,
    ownerId: accountId,
    createdBy: accountId,
    name: project.name,
    description: project.description ?? "",
    createdAt: toIsoDate(project.createdAt),
    updatedAt: toIsoDate(project.updatedAt),
  };
}

function docToProject(doc: ProjectDoc): Project {
  return {
    id: doc.id,
    areaId: doc.areaId ?? undefined,
    ownerId: doc.ownerId ?? undefined,
    name: doc.name,
    description: doc.description ? String(doc.description) : undefined,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt ?? doc._modified ?? Date.now()),
  };
}

function subtaskToDoc(
  subtask: Subtask,
): Omit<SubtaskDoc, "accountId" | "_modified" | "_deleted"> {
  return {
    id: subtask.id,
    taskId: subtask.taskId,
    title: subtask.title,
    description: subtask.description ?? "",
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

function settingsToDoc(
  settings: SettingsState,
): Omit<SettingsDoc, "id" | "accountId" | "_modified" | "_deleted"> {
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
  bg: "#f8f7f4",
  panel: "#ffffff",
  sidebar: "#fefefe",
  text: "#2d3436",
  mutedText: "#636e72",
  accent: "#6c5ce7",
  border: "#dfe6e9",
};

function docToSettings(doc: SettingsDoc): SettingsState {
  let palette = DEFAULT_PALETTE;
  try {
    palette = doc.customPalette
      ? (JSON.parse(doc.customPalette) as CustomPalette)
      : DEFAULT_PALETTE;
  } catch {
    palette = DEFAULT_PALETTE;
  }

  let pomodoro = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  };
  try {
    if (doc.pomodoro) pomodoro = JSON.parse(doc.pomodoro);
  } catch {
    // keep default
  }

  return {
    themeId: (doc.themeId as SettingsState["themeId"]) ?? "calm-beige",
    customPalette: palette,
    fontId: (doc.fontId as SettingsState["fontId"]) ?? "system",
    fontScale: (doc.fontScale as SettingsState["fontScale"]) ?? "md",
    density: (doc.density as SettingsState["density"]) ?? "cozy",
    showProgressBars: Boolean(doc.showProgressBars),
    reduceMotion: Boolean(doc.reduceMotion),
    soundEnabled: Boolean(doc.soundEnabled),
    celebrationsEnabled: Boolean(doc.celebrationsEnabled),
    pomodoro,
  };
}

function profileToDoc(
  user: UserState,
): Omit<ProfileDoc, "id" | "accountId" | "_modified" | "_deleted"> {
  return { name: user.profile?.name ?? "" };
}

function docToProfile(doc: ProfileDoc): UserState {
  const name = String(doc.name ?? "").trim();
  return {
    status: name ? "authenticated" : "anonymous",
    profile: name ? { name, provider: "local" as const } : null,
  };
}

// ---- Watch RxDB → atoms ---------------------------------------------------

function applyDocsToAtoms(
  tasks: TaskDoc[],
  subtasks: SubtaskDoc[],
  settings: SettingsDoc[],
  profiles: ProfileDoc[],
  areas: AreaDoc[],
  projects: ProjectDoc[],
  accountId: string,
): void {
  // An account switch can happen while the database read is pending. Never
  // let a refresh for the previous account repopulate the visible stores.
  if (accountId !== currentAccountId) return;
  $tasks.set(tasks.filter((doc) => doc.accountId === accountId).map(docToTask));
  $subtasks.set(
    subtasks.filter((doc) => doc.accountId === accountId).map(docToSubtask),
  );
  $areas.set(
    areas
      .filter((doc) => doc.accountId === accountId)
      .map(docToArea)
      .sort((a, b) => a.order - b.order),
  );
  $projects.set(
    projects
      .filter((doc) => doc.accountId === accountId)
      .map(docToProject)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const settingsDoc = settings.find((doc) => doc.accountId === accountId);
  $settings.set(settingsDoc ? docToSettings(settingsDoc) : defaultSettings);
  const profileDoc = profiles.find((doc) => doc.accountId === accountId);
  $user.set(
    profileDoc
      ? docToProfile(profileDoc)
      : { status: "anonymous", profile: null },
  );
}

/** Refresh the atom facade after an account switch, even if RxDB emitted no change. */
async function refreshRxDbToAtoms(accountId: string): Promise<void> {
  try {
    const db = await getRxDb();
    const [tasks, subtasks, settings, profiles, areas, projects] =
      await Promise.all([
        db.tasks.find().exec(),
        db.subtasks.find().exec(),
        db.settings.find().exec(),
        db.profile.find().exec(),
        db.areas.find().exec(),
        db.projects.find().exec(),
      ]);
    applyDocsToAtoms(
      tasks,
      subtasks,
      settings,
      profiles,
      areas,
      projects,
      accountId,
    );
  } catch (error) {
    console.error("Failed to refresh local-first stores:", error);
  }
}

/**
 * Subscribe to every collection's RxDB query observable and push results into
 * the Nanostores atoms. Run once after the database is created.
 */
export async function watchRxDbToAtoms(): Promise<() => void> {
  const db = await getRxDb();
  const subs: Array<{ unsubscribe(): void }> = [];

  subs.push(
    db.tasks
      .find()
      .$.subscribe((docs) =>
        $tasks.set(
          docs
            .filter((doc) => doc.accountId === currentAccountId)
            .map(docToTask),
        ),
      ),
  );
  subs.push(
    db.projects.find().$.subscribe((docs) =>
      $projects.set(
        docs
          .filter((doc) => doc.accountId === currentAccountId)
          .map(docToProject)
          .sort((a, b) => a.name.localeCompare(b.name)),
      ),
    ),
  );
  subs.push(
    db.subtasks
      .find()
      .$.subscribe((docs) =>
        $subtasks.set(
          docs
            .filter((doc) => doc.accountId === currentAccountId)
            .map(docToSubtask),
        ),
      ),
  );
  subs.push(
    db.areas.find().$.subscribe((docs) =>
      $areas.set(
        docs
          .filter((doc) => doc.accountId === currentAccountId)
          .map(docToArea)
          .sort((a, b) => a.order - b.order),
      ),
    ),
  );
  subs.push(
    db.settings.find().$.subscribe((docs) => {
      const doc = docs.find((item) => item.accountId === currentAccountId);
      $settings.set(doc ? docToSettings(doc) : defaultSettings);
    }),
  );
  subs.push(
    db.profile.find().$.subscribe((docs) => {
      const doc = docs.find((item) => item.accountId === currentAccountId);
      $user.set(
        doc ? docToProfile(doc) : { status: "anonymous", profile: null },
      );
    }),
  );

  return () => subs.forEach((s) => s.unsubscribe());
}

// ---- CRUD helpers (used by store actions) ---------------------------------

export async function rxInsertTask(task: Task): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;
  await db.tasks.upsert({
    ...taskToDoc(task, accountId),
    accountId,
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateTask(id: string, updated: Task): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const existing = await db.tasks
    .findOne({ selector: { id, accountId } })
    .exec();
  if (accountId !== getCurrentAccount()) return;
  const doc = {
    ...taskToDoc(updated, accountId),
    id,
    accountId,
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  };
  await db.tasks.upsert(doc);
}

export async function rxRemoveTask(id: string): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const doc = await db.tasks.findOne({ selector: { id, accountId } }).exec();
  if (accountId !== getCurrentAccount()) return;
  if (doc) await doc.remove();
}

export async function rxRemoveSubtasksForTask(taskId: string): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;
  await db.subtasks.find({ selector: { accountId, taskId } }).remove();
}

export async function rxInsertSubtask(subtask: Subtask): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;
  await db.subtasks.upsert({
    ...subtaskToDoc(subtask),
    accountId,
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateSubtask(
  id: string,
  updated: Subtask,
): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const existing = await db.subtasks
    .findOne({ selector: { id, accountId } })
    .exec();
  if (accountId !== getCurrentAccount()) return;
  const doc = {
    ...subtaskToDoc(updated),
    id,
    accountId,
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  };
  await db.subtasks.upsert(doc);
}

export async function rxRemoveSubtask(id: string): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const doc = await db.subtasks.findOne({ selector: { id, accountId } }).exec();
  if (accountId !== getCurrentAccount()) return;
  if (doc) await doc.remove();
}

export async function rxInsertArea(area: Area): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;
  await db.areas.upsert({
    ...areaToDoc(area),
    accountId,
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateArea(id: string, area: Area): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const existing = await db.areas
    .findOne({ selector: { id, accountId } })
    .exec();
  if (accountId !== getCurrentAccount()) return;
  await db.areas.upsert({
    ...areaToDoc(area),
    id,
    accountId,
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  });
}

export async function rxRemoveArea(id: string): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const doc = await db.areas.findOne({ selector: { id, accountId } }).exec();
  if (accountId !== getCurrentAccount()) return;
  if (doc) await doc.remove();
}

export async function rxInsertProject(project: Project): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;
  await db.projects.upsert({
    ...projectToDoc(project, accountId),
    accountId,
    _modified: nowIso(),
    _deleted: false,
  });
}

export async function rxUpdateProject(
  id: string,
  project: Project,
): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const existing = await db.projects
    .findOne({ selector: { id, accountId } })
    .exec();
  if (accountId !== getCurrentAccount()) return;
  await db.projects.upsert({
    ...projectToDoc(project, accountId),
    id,
    accountId,
    _modified: nowIso(),
    _deleted: existing?._deleted ?? false,
  });
}

export async function rxRemoveProject(id: string): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  const doc = await db.projects.findOne({ selector: { id, accountId } }).exec();
  if (accountId !== getCurrentAccount()) return;
  if (doc) await doc.remove();
}

export async function rxSaveSettings(settings: SettingsState): Promise<void> {
  const db = await getRxDb();
  const existing = await db.settings
    .findOne({ selector: { accountId: getCurrentAccount() } })
    .exec();
  const id = accountScopedId("settings");
  await db.settings.upsert({
    id,
    ...settingsToDoc(settings),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
  if (existing && existing.id !== id) await existing.remove();
}

export async function rxSaveProfile(user: UserState): Promise<void> {
  const db = await getRxDb();
  const existing = await db.profile
    .findOne({ selector: { accountId: getCurrentAccount() } })
    .exec();
  const id = accountScopedId("profile");
  await db.profile.upsert({
    id,
    ...profileToDoc(user),
    accountId: getCurrentAccount(),
    _modified: nowIso(),
    _deleted: false,
  });
  if (existing && existing.id !== id) await existing.remove();
}

const TASK_DRAFT_ID = "task-form";
const LEGACY_TASK_DRAFT_ID = "task-form";

function taskDraftId(accountId = getCurrentAccount()): string {
  return `${accountId || "guest"}:${TASK_DRAFT_ID}`;
}

export async function rxLoadTaskDraft(): Promise<TaskDraftSnapshot | null> {
  const db = await getRxDb();
  let document = await db.drafts
    .findOne({ selector: { id: taskDraftId() } })
    .exec();
  if (!document && getCurrentAccount() === "") {
    document = await db.drafts
      .findOne({ selector: { id: LEGACY_TASK_DRAFT_ID } })
      .exec();
  }
  if (!document) return null;
  try {
    const parsed = JSON.parse(document.data) as Partial<TaskDraftSnapshot>;
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.description !== "string"
    )
      return null;
    return {
      title: parsed.title,
      description: parsed.description,
      scheduledDate: parsed.scheduledDate,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      projectId: parsed.projectId,
      newSubtasks: Array.isArray(parsed.newSubtasks)
        ? parsed.newSubtasks.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    };
  } catch {
    return null;
  }
}

export async function rxSaveTaskDraft(
  draft: TaskDraftSnapshot,
  accountId = getCurrentAccount(),
): Promise<void> {
  const db = await getRxDb();
  await db.drafts.upsert({
    id: taskDraftId(accountId),
    accountId,
    data: JSON.stringify(draft),
    updatedAt: nowIso(),
  });
}

export async function rxClearTaskDraft(): Promise<void> {
  const db = await getRxDb();
  const document = await db.drafts
    .findOne({ selector: { id: taskDraftId() } })
    .exec();
  if (document) await document.remove();
  if (getCurrentAccount() === "") {
    const legacyDocument = await db.drafts
      .findOne({ selector: { id: LEGACY_TASK_DRAFT_ID } })
      .exec();
    if (legacyDocument) await legacyDocument.remove();
  }
}

// ---- Bulk operations (data backup import / full reset) --------------------

export interface BackupPayload {
  tasks?: Task[];
  subtasks?: Subtask[];
  areas?: Area[];
  projects?: Project[];
  settings?: SettingsState;
}

/**
 * Replace every synced collection with the contents of a backup.
 * The existing docs are removed first so the imported data fully takes over.
 */
export async function rxImportBackup(data: BackupPayload): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  if (accountId !== getCurrentAccount()) return;

  await Promise.all([
    db.tasks.find({ selector: { accountId } }).remove(),
    db.subtasks.find({ selector: { accountId } }).remove(),
    db.areas.find({ selector: { accountId } }).remove(),
    db.projects.find({ selector: { accountId } }).remove(),
    db.settings.find({ selector: { accountId } }).remove(),
    db.profile.find({ selector: { accountId } }).remove(),
    db.drafts.find({ selector: { id: taskDraftId(accountId) } }).remove(),
  ]);
  if (accountId !== getCurrentAccount()) return;

  if (data.tasks?.length) {
    await db.tasks.bulkUpsert(
      data.tasks.map((t) => ({
        ...taskToDoc(t, accountId),
        accountId,
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.subtasks?.length) {
    await db.subtasks.bulkUpsert(
      data.subtasks.map((s) => ({
        ...subtaskToDoc(s),
        accountId,
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.areas?.length) {
    await db.areas.bulkUpsert(
      data.areas.map((area) => ({
        ...areaToDoc(area),
        accountId,
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.projects?.length) {
    await db.projects.bulkUpsert(
      data.projects.map((project) => ({
        ...projectToDoc(project, accountId),
        accountId,
        _modified: nowIso(),
        _deleted: false,
      })),
    );
  }
  if (data.settings) {
    await db.settings.upsert({
      id: `${accountId || "guest"}:settings`,
      ...settingsToDoc(data.settings),
      accountId,
      _modified: nowIso(),
      _deleted: false,
    });
  }
}

/**
 * Remove every document from all collections (used by "apagar todos os dados").
 */
export async function rxClearAllData(): Promise<void> {
  const accountId = getCurrentAccount();
  const db = await getRxDb();
  await Promise.all([
    db.tasks.find({ selector: { accountId } }).remove(),
    db.subtasks.find({ selector: { accountId } }).remove(),
    db.areas.find({ selector: { accountId } }).remove(),
    db.projects.find({ selector: { accountId } }).remove(),
    db.settings.find({ selector: { accountId } }).remove(),
    db.profile.find({ selector: { accountId } }).remove(),
    db.drafts.find({ selector: { id: taskDraftId(accountId) } }).remove(),
  ]);
}

// ---- Migration from localStorage ------------------------------------------

/**
 * Seed RxDB collections from the legacy localStorage blob (if present), then
 * remove the legacy key so the old persistence layer stops writing there.
 */
export async function migrateLocalStorageToRxDb(): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await getRxDb();
  const KEY = "tarefitas_v1_data";

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
        id: accountScopedId("settings"),
        ...settingsToDoc(data.settings),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      });
    }
    if (data.user?.profile?.name) {
      await db.profile.upsert({
        id: accountScopedId("profile"),
        name: String(data.user.profile.name),
        accountId: getCurrentAccount(),
        _modified: nowIso(),
        _deleted: false,
      });
    }

    localStorage.removeItem(KEY);
  } catch (err) {
    console.warn("RxDB localStorage migration failed:", err);
  }
}
