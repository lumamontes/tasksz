import { describe, expect, it } from 'vitest';
import { isExpectedSyncError, isPermanentSyncError, shouldRecommendReload, syncErrorMessage } from './syncErrors';

const push = (...errors: object[]) => ({ code: 'RC_PUSH', message: 'RxReplication push handler threw an error', parameters: { errors } });

describe('sync error classification', () => {
  it('looks inside RxDB push/pull wrappers', () => {
    const missingColumn = push({ code: 'PGRST204', message: "Could not find the 'x' column" });
    expect(isPermanentSyncError(missingColumn)).toBe(true);
    expect(shouldRecommendReload(missingColumn)).toBe(true);
    expect(syncErrorMessage(missingColumn)).toBe("Could not find the 'x' column");
  });

  it('keeps retrying foreign key ordering and duplicate inserts without reporting them', () => {
    const fk = push({ code: '23503', message: 'insert or update on table "tasks" violates foreign key constraint' });
    expect(isExpectedSyncError(fk)).toBe(true);
    expect(isPermanentSyncError(fk)).toBe(false);
    expect(isExpectedSyncError(push({ code: '23505', message: 'duplicate key value' }))).toBe(true);
  });

  it('never stops sync for JWT errors, which a session refresh fixes', () => {
    const expired = push({ code: 'PGRST301', message: 'JWT expired' });
    expect(isPermanentSyncError(expired)).toBe(false);
    expect(isExpectedSyncError(push({ code: 'PGRST303', message: 'JWT issued at future' }))).toBe(true);
  });

  it('reports errors that are neither expected nor permanent', () => {
    const network = push({ message: 'Failed to fetch' });
    expect(isExpectedSyncError(network)).toBe(false);
    expect(isPermanentSyncError(network)).toBe(false);
    expect(isExpectedSyncError(push({ code: '23503' }, { message: 'Failed to fetch' }))).toBe(false);
  });

  it('treats RLS denials as permanent', () => {
    expect(isPermanentSyncError(push({ code: '42501', message: 'new row violates row-level security policy' }))).toBe(true);
  });
});
