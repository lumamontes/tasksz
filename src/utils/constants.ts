/**
 * Application Constants
 */

export const APP_NAME = 'Tarefitas';
export const APP_VERSION = '0.0.1';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'tarefitas_auth_tokens',
  USER_DATA: 'tarefitas_user',
  ROUTINES: 'tarefitas_routines',
  COMPLETIONS: 'tarefitas_completions',
  SETTINGS: 'tarefitas_settings',
} as const;

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  ROUTINES: '/api/routines',
  COMPLETIONS: '/api/completions',
  SYNC: '/api/sync',
} as const;

// Google OAuth Scopes
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
] as const;

// Touch Target Minimums (WCAG AA)
export const TOUCH_TARGET_MIN = 44; // pixels

// Animation Durations
export const ANIMATION_DURATION = {
  GENTLE: 150,
  STANDARD: 250,
  SLOW: 350,
} as const;

// Debounce Times
export const DEBOUNCE_TIME = {
  CLICK: 300, // ms
  INPUT: 500, // ms
  SEARCH: 800, // ms
} as const;
