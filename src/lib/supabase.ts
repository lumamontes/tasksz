/**
 * Supabase client factory (infrastructure layer).
 * Creates the singleton Supabase client from environment variables.
 * Returns null when sync is not configured, so the app stays fully
 * functional (local-first) without a Supabase project.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeRestFilters } from './rxdb/fieldNames';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any> | null = null;

/**
 * RxDB's Supabase adapter maps document bodies but not its optimistic update
 * filters; normalize those before PostgREST receives the request.
 */
function mapRestFilterFields(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = new URL(input instanceof Request ? input.url : input.toString());
  if (!requestUrl.pathname.startsWith('/rest/v1/')) return fetch(input, init);

  const normalized = normalizeRestFilters(requestUrl);
  const request = input instanceof Request ? new Request(normalized, input) : normalized;
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
