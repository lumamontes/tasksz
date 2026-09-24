/**
 * Local RxDB field names and their Supabase column names. The single source
 * for document mapping (database.ts) and REST filter mapping (supabase.ts):
 * the two used to drift, which broke optimistic updates of Projects.
 */
export const FIELD_NAMES = [
  ['accountId', 'account_id'],
  ['createdBy', 'created_by'],
  ['projectId', 'project_id'],
  ['assigneeId', 'assignee_id'],
  ['areaId', 'area_id'],
  ['ownerId', 'owner_id'],
  ['updatedAt', 'updated_at'],
  ['createdAt', 'created_at'],
  ['order', 'sort_order'],
  ['scheduledDate', 'scheduled_date'],
  ['startDate', 'start_date'],
  ['endDate', 'end_date'],
  ['taskId', 'task_id'],
  ['themeId', 'theme_id'],
  ['customPalette', 'custom_palette'],
  ['fontId', 'font_id'],
  ['fontScale', 'font_scale'],
  ['showProgressBars', 'show_progress_bars'],
  ['reduceMotion', 'reduce_motion'],
  ['soundEnabled', 'sound_enabled'],
  ['celebrationsEnabled', 'celebrations_enabled'],
] as const;

/**
 * Local fields with no column in a table. Projects are scoped by `owner_id`,
 * so their local `accountId` is never pushed.
 */
const LOCAL_ONLY_FIELDS: Record<string, readonly string[]> = {
  projects: ['accountId'],
};

const FILTER_OPERATOR = /^(eq|neq|gt|gte|lt|lte|is|in|like|ilike|cs|cd|ov|fts|plfts|phfts|not\.)/;

/**
 * RxDB's Supabase plugin guards updates with equality filters built from the
 * server-format row, then adds `<field>=is.null` for every LOCAL schema field
 * missing from that row. For renamed fields that adds camelCase filters:
 * - if the row already constrains the server column, the camelCase filter is
 *   an artifact and is dropped (renaming it would add `col=is.null` next to
 *   `col=eq.value`, which matches nothing and turns every update into a
 *   conflict);
 * - if the table has no such column (see LOCAL_ONLY_FIELDS), it is dropped;
 * - otherwise the field really is absent, so it becomes `column=is.null`.
 */
export function normalizeRestFilters(url: URL): URL {
  const result = new URL(url);
  const params = result.searchParams;
  const table = result.pathname.split('/').pop() ?? '';
  const localOnly = new Set(LOCAL_ONLY_FIELDS[table] ?? []);

  for (const [localName, serverName] of FIELD_NAMES) {
    const values = params.getAll(localName);
    if (!values.length) continue;

    // `order` is also PostgREST's sort parameter (`order=_modified.asc`);
    // only filter expressions such as `order=eq.0` belong to `sort_order`.
    const filters = localName === 'order' ? values.filter((value) => FILTER_OPERATOR.test(value)) : values;
    if (!filters.length) continue;

    const alreadyConstrained = params.has(serverName) || localOnly.has(localName);
    const kept = values.filter((value) => !filters.includes(value));
    params.delete(localName);
    for (const value of kept) params.append(localName, value);
    if (alreadyConstrained) continue;
    for (const value of filters) params.append(serverName, value);
  }

  return result;
}
