/**
 * User Store
 * Backs the RxDB `profile` collection (synced per account).
 *
 * The name users see is derived from the auth session (Google/full name or
 * email), not from a local onboarding step — see `getAuthDisplayName()` in
 * authStore. This store keeps the profile document in sync across devices.
 */

import { atom } from 'nanostores';
import { rxSaveProfile } from '../lib/rxdb/bridge';

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
  profile: null,
};

// User state atom (fed by bridge.ts from the RxDB `profile` collection)
export const $user = atom<UserState>(defaultUserState);

// Persists a profile document (e.g. after a display-name change)
export function saveDisplayName(name: string) {
  const trimmed = name.trim();
  const updated: UserState = {
    status: trimmed ? 'authenticated' : 'anonymous',
    profile: trimmed
      ? { name: trimmed, provider: 'local' }
      : null,
  };
  $user.set(updated);
  void rxSaveProfile(updated);
}