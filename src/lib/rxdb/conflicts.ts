/**
 * Sync conflict handling for the Supabase replication.
 *
 * The server rewrites `_modified` on every update, so a second edit made
 * before Realtime echoes the first one fails the optimistic `_modified` check
 * even though nobody else changed the row. RxDB's default handler would then
 * keep the server version (dropping the edit) and, because push conflicts skip
 * the pull modifier, write that snake_case server row into the local database,
 * hiding it from the app until the next pull.
 *
 * Tasks, Areas and Projects are edited by one person across their devices, so
 * the latest local edit wins, except that a deletion on either side sticks.
 */

import { deepEqual } from 'rxdb/plugins/utils';
import type { RxConflictHandler, WithDeleted } from 'rxdb';

type Doc = Record<string, unknown> & { _deleted: boolean };

const VOLATILE_FIELDS = ['_modified', '_meta', '_rev', '_attachments'];

function comparable(doc: Record<string, unknown>) {
  const copy = { ...doc };
  for (const field of VOLATILE_FIELDS) delete copy[field];
  return copy;
}

/** Documents that differ only in server-managed fields are the same edit. */
export function isSameDocument(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return deepEqual(comparable(a), comparable(b));
}

/**
 * @param toLocal maps a server row to the local document shape.
 */
export function resolveSyncConflict(newDocumentState: Doc, realMasterState: Doc, toLocal: (row: Doc) => Doc): Doc {
  const master = toLocal(realMasterState);
  // Projects have no account column; keep the local scope.
  if (master.accountId === undefined && newDocumentState.accountId !== undefined) {
    master.accountId = newDocumentState.accountId;
  }
  if (master._deleted) return master;
  if (newDocumentState._deleted) return newDocumentState;
  return newDocumentState;
}

export function createConflictHandler<T>(toLocal: (row: Doc) => Doc): RxConflictHandler<T> {
  return {
    isEqual: (a, b) => isSameDocument(a as unknown as Doc, b as unknown as Doc),
    resolve: async ({ newDocumentState, realMasterState }) =>
      resolveSyncConflict(newDocumentState as unknown as Doc, realMasterState as unknown as Doc, toLocal) as unknown as WithDeleted<T>,
  };
}
