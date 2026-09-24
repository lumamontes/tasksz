/**
 * Replication lifecycle manager.
 * Starts Supabase replication for the signed-in user and stops it on sign-out.
 *
 * The RxDB-Supabase plugin is fire-and-forget: once started it keeps the
 * local collections in sync while the app runs. This module just wires it to
 * auth transitions and reports errors back to the sync status atom.
 */

import { getSupabase } from '../supabase';
import { getRxDb, startReplication, type ReplicationHandle } from './database';
import { isExpectedSyncError, isPermanentSyncError, shouldRecommendReload, syncErrorMessage } from './syncErrors';
import {
  dismissReloadRecommendation,
  recommendReload,
  setSyncError,
} from '../../stores/syncStore';

let active: ReplicationHandle | null = null;

/**
 * Start two-way sync for a signed-in user. Replaces any previous replication
 * (e.g. after switching accounts).
 */
export function startSyncForAccount(accountId: string): Promise<void> {
  return enqueue(() => runStart(accountId));
}

/**
 * Stop all active replication. Safe to call multiple times.
 */
export function stopSync(): Promise<void> {
  return enqueue(runStop);
}

// Start and stop run one at a time: two overlapping starts would create two
// replications with the same Realtime channel names.
let lifecycle: Promise<void> = Promise.resolve();

function enqueue(step: () => Promise<void>): Promise<void> {
  lifecycle = lifecycle.then(step, step);
  return lifecycle;
}

async function runStart(accountId: string): Promise<void> {
  await runStop();
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const db = await getRxDb();
    void db; // database must exist; watcher already running at boot
    active = await startReplication(supabase, accountId);
    const states = [active.tasks, active.subtasks, active.settings, active.profile, active.areas, active.projects];
    for (const state of states) {
      state.error$.subscribe((err) => {
        // Conflicts and out-of-order inserts resolve on retry; do not alarm.
        if (isExpectedSyncError(err)) return;
        setSyncError(syncErrorMessage(err));
        if (shouldRecommendReload(err)) {
          recommendReload();
        }
        if (isPermanentSyncError(err)) {
          // Retrying a malformed PostgREST query cannot succeed. Stop this
          // replication until the client is updated or the problem is fixed.
          void stopSync();
        }
      });
    }

    // A successful initial sync proves that this client is compatible with the
    // current remote schema, so do not keep showing a stale reload notice.
    void Promise.all(states.map((state) => state.awaitInitialReplication()))
      .then(() => dismissReloadRecommendation())
      .catch(() => undefined);
  } catch (err) {
    setSyncError(err instanceof Error ? err.message : 'Não foi possível iniciar a sincronização.');
  }
}

async function runStop(): Promise<void> {
  if (!active) return;
  await Promise.allSettled([
    active.tasks.cancel(),
    active.subtasks.cancel(),
    active.settings.cancel(),
    active.profile.cancel(),
    active.areas.cancel(),
    active.projects.cancel(),
  ]);
  active = null;
}

export function isSyncingEnabled(): boolean {
  return active !== null;
}
