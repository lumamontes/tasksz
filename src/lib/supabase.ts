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

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}

export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}
