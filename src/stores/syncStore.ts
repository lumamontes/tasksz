/**
 * Sync state store (nanostore).
 * Tracks sync lifecycle state for UI status indicators and reports the last
 * replication error.
 *
 * Synchronization itself is handled by the RxDB ↔ Supabase replication plugin
 * (see src/lib/rxdb/replication.ts); this store only surfaces its status so
 * the UI can render a lightweight indicator.
 */

import { atom } from 'nanostores';
import { APP_VERSION } from '../utils/constants';

export interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  reloadRecommended: boolean;
}

export const $syncState = atom<SyncState>({
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
  reloadRecommended: false,
});

export function setSyncing(isSyncing: boolean): void {
  $syncState.set({ ...$syncState.get(), isSyncing });
}

export function setPendingCount(pendingCount: number): void {
  $syncState.set({ ...$syncState.get(), pendingCount });
}

export function setLastSyncedAt(timestamp: string): void {
  $syncState.set({
    ...$syncState.get(),
    lastSyncedAt: timestamp,
    lastError: null,
  });
}

export function setSyncError(error: string | null): void {
  $syncState.set({ ...$syncState.get(), lastError: error });
}

export function recommendReload(): void {
  if (typeof window !== 'undefined' && window.sessionStorage.getItem(`tarefitas:reload-notice:${APP_VERSION}`)) return;
  $syncState.set({ ...$syncState.get(), reloadRecommended: true });
}

export function dismissReloadRecommendation(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(`tarefitas:reload-notice:${APP_VERSION}`, 'dismissed');
  }
  $syncState.set({ ...$syncState.get(), reloadRecommended: false });
}
