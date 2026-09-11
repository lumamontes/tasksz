/**
 * Supabase client factory (infrastructure layer).
 * Creates the singleton Supabase client from environment variables.
 * Returns null when sync is not configured, so the app stays fully
 * functional (local-first) without a Supabase project.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any> | null = null;

const REST_FIELD_NAMES: Record<string, string> = {
  accountId: 'account_id',
  createdBy: 'created_by',
  projectId: 'project_id',
  assigneeId: 'assignee_id',
  createdAt: 'created_at',
  order: 'sort_order',
  scheduledDate: 'scheduled_date',
  taskId: 'task_id',
  themeId: 'theme_id',
  customPalette: 'custom_palette',
  fontId: 'font_id',
  fontScale: 'font_scale',
  showProgressBars: 'show_progress_bars',
  reduceMotion: 'reduce_motion',
  soundEnabled: 'sound_enabled',
  celebrationsEnabled: 'celebrations_enabled',
};

/**
 * RxDB's Supabase adapter maps document bodies but not optimistic update
 * filters. Normalize those filter names before PostgREST receives the request.
 */
function mapRestFilterFields(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = new URL(input instanceof Request ? input.url : input.toString());
  if (!requestUrl.pathname.startsWith('/rest/v1/')) return fetch(input, init);

  for (const [localName, serverName] of Object.entries(REST_FIELD_NAMES)) {
    const values = requestUrl.searchParams.getAll(localName);
    if (!values.length) continue;

    // PostgREST also uses the `order` query parameter for sorting, for example
    // `order=_modified.asc,id.asc`. Only rewrite filter expressions such as
    // `order=eq.0`.
    const filterValues = values.filter((value) =>
      /^(eq|neq|gt|gte|lt|lte|is|in|like|ilike|cs|cd|ov|fts|plfts|phfts|not\.)/.test(value)
    );
    if (localName === 'order' && !filterValues.length) continue;

    requestUrl.searchParams.delete(localName);
    for (const value of localName === 'order' ? filterValues : values) {
      requestUrl.searchParams.append(serverName, value);
    }
  }

  const request = input instanceof Request ? new Request(requestUrl, input) : requestUrl;
  return fetch(request, init);
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, { global: { fetch: mapRestFilterFields } });
  return client;
}

export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}
