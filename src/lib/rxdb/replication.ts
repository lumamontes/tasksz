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
export async function startSyncForAccount(accountId: string): Promise<void> {
  await stopSync();
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const db = await getRxDb();
    void db; // database must exist; watcher already running at boot
    active = await startReplication(supabase, accountId);
    const states = [active.tasks, active.subtasks, active.settings, active.profile];
    for (const state of states) {
      state.error$.subscribe((err) => setSyncError(err?.message ?? 'Falha na sincronização.'));
      state.error$.subscribe((err) => {
        const message = err?.message ?? '';
        if (/column|schema|relation|migration|plugin|not found/i.test(message)) {
          recommendReload();
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

/**
 * Stop all active replication. Safe to call multiple times.
 */
export async function stopSync(): Promise<void> {
  if (!active) return;
  await Promise.allSettled([
    active.tasks.cancel(),
    active.subtasks.cancel(),
    active.settings.cancel(),
    active.profile.cancel(),
  ]);
  active = null;
}

export function isSyncingEnabled(): boolean {
  return active !== null;
}
