/**
 * Authentication state management with Nanostores
 * Provider-agnostic auth architecture
 */

import { atom, computed } from 'nanostores';
import { setUserProfile, clearUser, type UserProfile } from './userStore';

export type AuthProvider = 'google' | 'local' | null;

export interface AuthState {
  status: 'anonymous' | 'authenticated';
  provider: AuthProvider;
  isLoading: boolean;
  error: string | null;
}

// Auth atom with initial state
export const $auth = atom<AuthState>({
  status: 'anonymous',
  provider: null,
  isLoading: false,
  error: null,
});

// Computed store for authentication status
export const $isAuthenticated = computed($auth, (auth) => auth.status === 'authenticated');

// Google Auth Actions (future-proof architecture)
export const googleAuth = {
  // Initialize Google Identity Services
  initialize: () => {
    if (typeof window === 'undefined') return;
    
    // Load Google Identity Services script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  },

  // Sign in with Google
  signIn: async (): Promise<UserProfile | null> => {
    if (typeof window === 'undefined' || !window.google) {
      console.warn('Google Identity Services not loaded');
      return null;
    }

    return new Promise((resolve) => {
      $auth.set({ ...$auth.get(), isLoading: true });

      window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'email profile',
        callback: (response: any) => {
          // TODO: Exchange token for user info
          // For now, this is a placeholder
          console.log('Google auth response:', response);
          $auth.set({
            status: 'authenticated',
            provider: 'google',
            isLoading: false,
            error: null
          });
          resolve(null);
        },
      }).requestAccessToken();
    });
  },

  // Sign out
  signOut: () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.oauth2.revoke('', () => {
        $auth.set({
          status: 'anonymous',
          provider: null,
          isLoading: false,
          error: null
        });
        clearUser();
      });
    } else {
      $auth.set({
        status: 'anonymous',
        provider: null,
        isLoading: false,
        error: null
      });
      clearUser();
    }
  }
};

// Generic auth actions
export const authActions = {
  setLoading: (isLoading: boolean) => {
    $auth.set({
      ...$auth.get(),
      isLoading,
      error: null,
    });
  },

  setError: (error: string) => {
    $auth.set({
      ...$auth.get(),
      isLoading: false,
      error,
    });
  },

  clearError: () => {
    $auth.set({
      ...$auth.get(),
      error: null,
    });
  },
};

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}