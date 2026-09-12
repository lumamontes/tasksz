/**
 * Supabase auth provider.
 * Bridges the AuthProvider contract to Supabase's email/password auth.
 * Returns early (unconfigured) when no project env vars are set, so the app
 * keeps working fully local-first.
 */

import { getSupabase } from '../supabase';
import type { AuthProvider, AuthSession } from './types';

function toSession(session: {
  user?: {
    id?: string;
    email?: string | null;
    user_metadata?: { full_name?: string; name?: string } | null;
  } | null;
}): AuthSession | null {
  const id = session?.user?.id;
  if (!id) return null;
  const meta = session?.user?.user_metadata;
  return {
    userId: id,
    email: session?.user?.email ?? null,
    name: meta?.full_name ?? meta?.name ?? null,
  };
}

class SupabaseAuthProvider implements AuthProvider {
  get isConfigured(): boolean {
    return getSupabase() !== null;
  }

  async getSession(): Promise<AuthSession | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return toSession(data?.session ?? { user: null });
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const supabase = getSupabase();
    if (!supabase) return () => undefined;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(toSession(session ?? { user: null }));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(
    email: string,
    password: string,
  ): Promise<{ session: AuthSession | null; requiresEmailConfirmation: boolean }> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Sincronização não configurada.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // No session means the project requires email confirmation.
    if (!data.session) return { session: null, requiresEmailConfirmation: true };
    return { session: toSession(data.session), requiresEmailConfirmation: false };
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Sincronização não configurada.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const session = toSession(data.session ?? { user: null });
    if (!session) throw new Error('Não foi possível entrar.');
    return session;
  }

  async signInWithOAuth(provider: 'google'): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Sincronização não configurada.');
    // Always return to the app after OAuth. Returning to the landing page
    // leaves the user authenticated but does not open the dashboard.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/app/tarefas` },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  }
}

const provider = new SupabaseAuthProvider();
export { provider as supabaseAuthProvider, toSession };
