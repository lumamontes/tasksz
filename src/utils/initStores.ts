/**
 * Initialize nanostores from Astro
 * This allows Astro to initialize stores before React components hydrate
 */

import { setupPersistence } from '../stores/persistence';
import { initializeSettings } from '../stores/settingsStore';
import { initializeMiniTimer } from '../stores/miniTimerStore';

/**
 * Initialize all stores on client-side
 * Call this from Astro scripts to set up state before React hydration
 */
export function initStores() {
  if (typeof window === 'undefined') return;
  
  // Initialize persistence (loads data from localStorage)
  setupPersistence();
  
  // Initialize settings (applies theme and font)
  initializeSettings();
  
  // Initialize mini timer
  initializeMiniTimer();
}
