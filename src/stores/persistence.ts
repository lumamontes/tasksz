/**
 * Persistence Layer
 *
 * Local-first storage now lives in RxDB (IndexedDB via Dexie). This module is
 * the boot entrypoint: it creates the database, migrates any legacy
 * localStorage blob, and starts the RxDB → Nanostores watcher so the UI is
 * fed from the local-first source of truth. Supabase replication is additive
 * and handled separately on sign-in.
 *
 * The legacy best-effort functions below are kept for backward compatibility
 * with call sites (e.g. onboarding, Data section) but no longer write to
 * localStorage.
 */

import { getRxDb } from "../lib/rxdb/database";
import {
  migrateLocalStorageToRxDb,
  watchRxDbToAtoms,
} from "../lib/rxdb/bridge";
import { recommendReload } from "./syncStore";
import { atom } from "nanostores";

let setupPromise: Promise<void> | null = null;
export const $persistenceReady = atom(false);

/**
 * Initialize the local-first database, migrate legacy data, and start the
 * watcher that feeds the Nanostores atoms.
 */
export async function setupPersistence(): Promise<void> {
  if (typeof window === "undefined") return;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      await getRxDb();
      await migrateLocalStorageToRxDb();
      await watchRxDbToAtoms();
      $persistenceReady.set(true);
    } catch (error) {
      console.error("Failed to initialize local-first storage:", error);
      if (/DB6|schema|migration/i.test(String(error))) recommendReload();
      $persistenceReady.set(true);
      setupPromise = null;
    }
  })();

  return setupPromise;
}

// Keep the exported surface the app historically had. These are no-ops for
// persistence now, but some components still import them.

export async function saveToLocalStorage(): Promise<void> {
  // Data persists through RxDB on every mutation; nothing extra to do.
  return;
}

export function loadFromLocalStorage(): boolean {
  return false;
}

export async function clearLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await getRxDb();
    await Promise.all([
      db.tasks.find().remove(),
      db.subtasks.find().remove(),
      db.settings.find().remove(),
      db.profile.find().remove(),
      db.areas.find().remove(),
      db.projects.find().remove(),
      db.drafts.find().remove(),
    ]);
  } catch (error) {
    console.error("Failed to clear local-first storage:", error);
  }
}

export function seedDemoData(): void {
  // Demo data is no longer seeded automatically; the app is empty on first run.
  // Kept as a no-op for any existing call sites.
}
