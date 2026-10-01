import { describe, expect, it } from 'vitest';
import { normalizeRestFilters } from './fieldNames';

const rest = (query: string) => new URL(`http://127.0.0.1:54321/rest/v1/tasks?${query}`);
const params = (url: URL) => [...url.searchParams.entries()];

describe('normalizeRestFilters', () => {
  it('drops the plugin is-null guard for a column the row already constrains', () => {
    const url = normalizeRestFilters(rest('id=eq.t1&account_id=eq.user-1&accountId=is.null'));
    expect(params(url)).toEqual([['id', 'eq.t1'], ['account_id', 'eq.user-1']]);
  });

  it('renames the guard when the column is genuinely absent from the row', () => {
    const url = normalizeRestFilters(rest('id=eq.t1&projectId=is.null'));
    expect(params(url)).toEqual([['id', 'eq.t1'], ['project_id', 'is.null']]);
  });

  it('maps Project fields that previously had no REST mapping', () => {
    const url = normalizeRestFilters(new URL('http://127.0.0.1:54321/rest/v1/projects?owner_id=eq.u&ownerId=is.null&updatedAt=is.null'));
    expect(params(url)).toEqual([['owner_id', 'eq.u'], ['updated_at', 'is.null']]);
  });

  it('drops guards for local fields a table does not have', () => {
    const url = normalizeRestFilters(new URL('http://127.0.0.1:54321/rest/v1/projects?id=eq.p1&accountId=is.null'));
    expect(params(url)).toEqual([['id', 'eq.p1']]);
  });

  it('keeps `order` as a sort parameter and maps it only as a filter', () => {
    expect(params(normalizeRestFilters(rest('order=_modified.asc,id.asc')))).toEqual([['order', '_modified.asc,id.asc']]);
    expect(params(normalizeRestFilters(rest('order=eq.0&order=_modified.asc')))).toEqual([['order', '_modified.asc'], ['sort_order', 'eq.0']]);
  });
});
