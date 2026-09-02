/**
 * User Store
 * Manages user profile information (name, auth status)
 */

import { atom } from 'nanostores';

export interface UserProfile {
  name: string;
  provider: 'local';
}

export type AuthStatus = 'anonymous' | 'authenticated';

export interface UserState {
  status: AuthStatus;
  profile: UserProfile | null;
}

// Default user state
const defaultUserState: UserState = {
  status: 'anonymous',
  profile: null
};

// User state atom
export const $user = atom<UserState>(defaultUserState);

// Actions
export function setUserName(name: string) {
  const current = $user.get();
  $user.set({
    status: current.status,
    profile: {
      name: name.trim() || 'Pessoa',
      provider: 'local'
    }
  });
}

// Check if user has completed onboarding (has a profile, even if name is default)
export function hasCompletedOnboarding(): boolean {
  const user = $user.get();
  return user.profile !== null;
}

// Get user name (with fallback)
export function getUserName(): string {
  // Avoid hydration mismatch by checking if we're in browser
  if (typeof window === 'undefined') {
    return 'Pessoa'; // Always return default on server
  }
  
  const user = $user.get();
  return user.profile?.name || 'Pessoa';
}
