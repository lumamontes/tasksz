/**
 * Application Constants
 */

export const APP_NAME = 'Tarefitas';
export const APP_VERSION = '0.1.0';

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

export const SITE_METADATA = {
  title: 'tarefitas',
  description: 'um simples site pra organizar rotina e tarefas',
  url: 'https://tarefitas.netlify.app',
  repoUrl: 'https://github.com/lumamontes/tasksz',
  privacyPolicyUrl: '/privacidade',
  contactEmail: 'lumagoesmontes@gmail.com',
  image: '/images/logo.png',
  keywords: ['tarefas', 'rotina', 'organização'],
} as const;
