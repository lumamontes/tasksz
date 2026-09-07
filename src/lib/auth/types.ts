/**
 * Auth provider abstraction (application layer).
 *
 * `authStore` talks only to an `AuthProvider`; the concrete provider is chosen
 * at startup (default: Supabase via `getSupabase()`). This keeps the auth state
 * machine decoupled from any specific backend, so the app stays testable and
 * can swap providers (or run a mock) without touching store logic.
 */

export interface AuthSession {
  userId: string;
  email: string | null;
  /** Display name (e.g. Google profile name). Null when the provider has none. */
  name: string | null;
}

export interface AuthProvider {
  /** Whether this provider can actually reach a backend right now. */
  readonly isConfigured: boolean;

  /** Restore a persisted session (if any) for this browser. */
  getSession(): Promise<AuthSession | null>;

  signUp(email: string, password: string): Promise<{
    session: AuthSession | null;
    requiresEmailConfirmation: boolean;
  }>;

  signIn(email: string, password: string): Promise<AuthSession>;

  /**
   * Kick off an OAuth sign-in (e.g. "google"). Redirects the browser away;
   * the returning session is restored by `getSession()` on the next load, so
   * this method resolves without producing a session synchronously.
   */
  signInWithOAuth(provider: 'google'): Promise<void>;

  signOut(): Promise<void>;
}