/**
 * Auth provider registry.
 * `authStore` consumes whatever provider is set here. Defaults to Supabase;
 * tests can inject a mock via `setAuthProvider`.
 */

import type { AuthProvider } from './types';
import { supabaseAuthProvider } from './supabaseProvider';

let currentProvider: AuthProvider = supabaseAuthProvider;

export function setAuthProvider(provider: AuthProvider): void {
  currentProvider = provider;
}

export function getAuthProvider(): AuthProvider {
  return currentProvider;
}