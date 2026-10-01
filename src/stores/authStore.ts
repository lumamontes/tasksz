/**
 * Auth store (nanostore).
 * Wraps an AuthProvider with a guest-first model: the app is fully usable
 * without an account; signing in opts into cross-device sync for this browser.
 *
 * The concrete provider is injected via the auth registry (default: Supabase),
 * so this module works (and stores nothing) when sync is not configured.
 */

import { atom } from "nanostores";
import { getAuthProvider } from "../lib/auth";
import type { AuthSession } from "../lib/auth/types";
import { startSyncForAccount, stopSync } from "../lib/rxdb/replication";
import { rekeyToAccount, setCurrentAccount } from "../lib/rxdb/bridge";
import { resetTaskDraftState, restoreTaskDraft } from "./uiStore";
import { trackEvent } from "../utils/analytics";

export interface AuthState {
  isInitialized: boolean;
  userId: string | null;
  email: string | null;
  name: string | null;
  isSubmitting: boolean;
  error: string | null;
  isModalOpen: boolean;
}

export const $auth = atom<AuthState>({
  isInitialized: false,
  userId: null,
  email: null,
  name: null,
  isSubmitting: false,
  error: null,
  isModalOpen: false,
});

export function openAuthModal(): void {
  setPartial({ isModalOpen: true });
}

export function closeAuthModal(): void {
  setPartial({ isModalOpen: false });
}

function setPartial(partial: Partial<AuthState>): void {
  $auth.set({ ...$auth.get(), ...partial });
}

let sessionApplication: {
  userId: string | null;
  promise: Promise<void>;
} | null = null;

/**
 * Sign-up and sign-in resolve while Supabase also emits the same session via
 * `onAuthStateChange`. Reuse the in-flight application for the same user and
 * queue a different one, so re-keying and replication never start twice.
 */
function applySession(session: AuthSession | null): Promise<void> {
  const userId = session?.userId ?? null;
  if (sessionApplication?.userId === userId) return sessionApplication.promise;
  const previous = sessionApplication?.promise ?? Promise.resolve();
  const promise = previous
    .catch(() => undefined)
    .then(() => runApplySession(session));
  sessionApplication = { userId, promise };
  return promise;
}

async function runApplySession(session: AuthSession | null): Promise<void> {
  if (!session) {
    resetTaskDraftState();
    await stopSync();
    setCurrentAccount("");
    setPartial({
      userId: null,
      email: null,
      name: null,
    });
    return;
  }

  // Authentication must not depend on local database or sync startup. If
  // Supabase replication is unavailable, the user should still appear logged
  // in and be able to use the local app.
  setPartial({
    userId: session.userId,
    email: session.email,
    name: session.name,
  });
  resetTaskDraftState();

  try {
    await rekeyToAccount(session.userId);
    await startSyncForAccount(session.userId);
    await restoreTaskDraft();
  } catch (error) {
    console.error("Failed to start account synchronization:", error);
  }
}

/**
 * Friendly display name for a signed-in user: Google profile name when
 * available, otherwise the email local part. Returns null when anonymous.
 */
export function getAuthDisplayName(): string | null {
  const auth = $auth.get();
  if (!auth.userId) return null;
  if (auth.name?.trim()) return auth.name.trim();
  if (auth.email) return auth.email.split("@")[0] || null;
  return null;
}

let authInitPromise: Promise<void> | null = null;
let authListenerStarted = false;

function startAuthListener(): void {
  if (authListenerStarted) return;
  const provider = getAuthProvider();
  if (!provider.onAuthStateChange) return;

  authListenerStarted = true;
  provider.onAuthStateChange((session) => {
    const currentUserId = $auth.get().userId;
    if (session?.userId === currentUserId) {
      setPartial({ email: session.email, name: session.name });
      return;
    }
    void applySession(session).catch((error) => {
      console.error("Failed to apply authentication change:", error);
    });
  });
}

/**
 * Restore the persisted session (logged-in user) for this browser.
 * Safe to call many times — runs once and shares the same promise.
 */
export function initAuth(): Promise<void> {
  if (authInitPromise) return authInitPromise;
  authInitPromise = runInitAuth().finally(() => {
    authInitPromise = null;
  });
  return authInitPromise;
}

async function runInitAuth(): Promise<void> {
  if (!getAuthProvider().isConfigured) {
    setPartial({ isInitialized: true });
    return;
  }
  try {
    const session = await getAuthProvider().getSession();
    await applySession(session);
    startAuthListener();
    setPartial({ isInitialized: true });
  } catch {
    setPartial({ isInitialized: true });
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<boolean> {
  setPartial({ isSubmitting: true, error: null });
  try {
    const { session, requiresEmailConfirmation } =
      await getAuthProvider().signUp(email, password);
    if (requiresEmailConfirmation || !session) {
      // Email confirmation required (depends on the auth provider's settings).
      setPartial({
        isSubmitting: false,
        error:
          "Confirme seu e-mail para ativar a conta. Você já pode continuar usando o app localmente.",
      });
      return false;
    }
    await applySession(session);
    setPartial({ isSubmitting: false });
    trackEvent("sign_up");
    return true;
  } catch (err) {
    setPartial({
      isSubmitting: false,
      error:
        err instanceof Error ? err.message : "Não foi possível criar a conta.",
    });
    return false;
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<boolean> {
  setPartial({ isSubmitting: true, error: null });
  try {
    const session = await getAuthProvider().signIn(email, password);
    await applySession(session);
    setPartial({ isSubmitting: false });
    trackEvent("sign_in");
    return true;
  } catch (err) {
    setPartial({
      isSubmitting: false,
      error: err instanceof Error ? err.message : "Não foi possível entrar.",
    });
    return false;
  }
}

export async function signInWithGoogle(): Promise<boolean> {
  setPartial({ isSubmitting: true, error: null });
  try {
    await getAuthProvider().signInWithOAuth("google");
    // OAuth redirects the browser away; the session is restored by
    // `initAuth()` -> `getSession()` when the user comes back.
    setPartial({ isSubmitting: false });
    return true;
  } catch (err) {
    setPartial({
      isSubmitting: false,
      error:
        err instanceof Error
          ? err.message
          : "Não foi possível entrar com o Google.",
    });
    return false;
  }
}

export async function signOut(): Promise<void> {
  // Signing back in as the same user must start a fresh session application.
  sessionApplication = null;
  try {
    await getAuthProvider().signOut();
  } finally {
    await stopSync();
    setCurrentAccount("");
    setPartial({
      userId: null,
      email: null,
      name: null,
      error: null,
      isModalOpen: false,
    });
    trackEvent("sign_out");
  }
}

export function getCurrentUserId(): string | null {
  return $auth.get().userId;
}
