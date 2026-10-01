/**
 * Initialize nanostores from Astro
 * This allows Astro to initialize stores before React components hydrate.
 * Now local-first: creates the RxDB (IndexedDB) database, migrates legacy
 * localStorage data, starts the watcher that feeds the atoms, and starts
 * Supabase replication if a session is already active.
 */

import { setupPersistence } from "../stores/persistence";
import { initializeSettings } from "../stores/settingsStore";
import { initializeMiniTimer } from "../stores/miniTimerStore";
import { initAuth } from "../stores/authStore";
import { initAnalytics } from "./analytics";
import { restoreTaskDraft } from "../stores/uiStore";

/**
 * Initialize all stores on client-side.
 * Call this from Astro scripts to set up state before React hydration.
 */
export async function initStores() {
  if (typeof window === "undefined") return;

  // Initialize analytics (no-op unless env keys are configured)
  initAnalytics();

  // Initialize persistence (loads data from local-first storage)
  await setupPersistence();

  // Initialize settings (applies theme and font)
  initializeSettings();

  // Initialize mini timer
  initializeMiniTimer();

  // Restore session (if any) and start Supabase replication
  await initAuth();
  await restoreTaskDraft();
}
