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

function isPermanentSyncError(error: unknown): boolean {
  const value = error as { code?: unknown; message?: unknown } | null;
  const code = String(value?.code ?? '');
  const message = String(value?.message ?? error ?? '');
  return (
    /^PGRST\d+$/.test(code) ||
    code === '42501' ||
    code === '42703' ||
    /failed to parse order|column .* does not exist|row-level security policy/i.test(message)
  );
}

function isExpectedConflict(error: unknown): boolean {
  const value = error as { code?: unknown; status?: unknown; message?: unknown } | null;
  return (
    String(value?.code ?? '') === '23505' ||
    Number(value?.status) === 409 ||
    /duplicate key value|unique constraint/i.test(String(value?.message ?? error ?? ''))
  );
}

function shouldRecommendReload(error: unknown): boolean {
  const value = error as { code?: unknown; message?: unknown } | null;
  const code = String(value?.code ?? '');
  const message = String(value?.message ?? error ?? '');
  return (
    code === '42703' ||
    code === 'PGRST100' ||
    /column .* does not exist|failed to parse (filter|order)/i.test(message)
  );
}

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
    const states = [active.tasks, active.subtasks, active.settings, active.profile, active.areas, active.projects];
    for (const state of states) {
      state.error$.subscribe((err) => setSyncError(err?.message ?? 'Falha na sincronização.'));
      state.error$.subscribe((err) => {
        if (!isExpectedConflict(err) && shouldRecommendReload(err)) {
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
    active.areas.cancel(),
    active.projects.cancel(),
  ]);
  active = null;
}

export function isSyncingEnabled(): boolean {
  return active !== null;
}
