import { describe, expect, it } from 'vitest';
import { isSameDocument, resolveSyncConflict } from './conflicts';

type Doc = Record<string, unknown> & { _deleted: boolean };
const toLocal = (row: Doc): Doc => {
  const { account_id, project_id, ...rest } = row;
  return { ...rest, ...(account_id !== undefined ? { accountId: account_id } : {}), ...(project_id !== undefined ? { projectId: project_id } : {}) } as Doc;
};

const local: Doc = { id: 't1', accountId: 'u1', projectId: 'p2', title: 'Nova', _modified: '2026-09-24T10:00:01.000Z', _deleted: false };
const server: Doc = { id: 't1', account_id: 'u1', project_id: null, title: 'Antiga', _modified: '2026-09-24T10:00:00.500+00:00', _deleted: false };

describe('sync conflicts', () => {
  it('keeps the latest local edit instead of reverting to the server row', () => {
    expect(resolveSyncConflict(local, server, toLocal)).toBe(local);
  });

  it('lets a deletion on the server win, in local format', () => {
    const resolved = resolveSyncConflict(local, { ...server, _deleted: true }, toLocal);
    expect(resolved).toMatchObject({ id: 't1', accountId: 'u1', _deleted: true });
    expect(resolved).not.toHaveProperty('account_id');
  });

  it('keeps a local deletion', () => {
    expect(resolveSyncConflict({ ...local, _deleted: true }, server, toLocal)._deleted).toBe(true);
  });

  it('keeps the local account scope for tables without an account column', () => {
    const project: Doc = { id: 'p1', accountId: 'u1', name: 'Site', _deleted: false };
    const resolved = resolveSyncConflict(project, { id: 'p1', owner_id: 'u1', name: 'Site', _deleted: true }, (row) => row);
    expect(resolved.accountId).toBe('u1');
  });

  it('ignores server-managed fields when comparing', () => {
    expect(isSameDocument({ ...local, _modified: 'a', _rev: '1-x' }, { ...local, _modified: 'b', _rev: '2-y' })).toBe(true);
    expect(isSameDocument(local, { ...local, title: 'Outra' })).toBe(false);
  });
});
