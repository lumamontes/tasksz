/**
 * useStoreInit Hook
 * Centralized store initialization to avoid multiple useEffect calls
 */

import { useEffect, useRef } from 'react';
import { setupPersistence } from '../stores/persistence';
import { initializeSettings } from '../stores/settingsStore';
import { initializeMiniTimer } from '../stores/miniTimerStore';
import { loadPomodoroState } from '../stores/pomodoroStore';
import { initAuth } from '../stores/authStore';

interface StoreInitOptions {
  persistence?: boolean;
  settings?: boolean;
  miniTimer?: boolean;
  pomodoro?: boolean;
  auth?: boolean;
}

const defaultOptions: Required<StoreInitOptions> = {
  persistence: true,
  settings: true,
  miniTimer: false,
  pomodoro: false,
  auth: false,
};

/**
 * Initialize stores in a single effect
 * Prevents multiple initialization effects across components
 */
export function useStoreInit(options: StoreInitOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initialized.current) return;
    initialized.current = true;

    const run = async () => {
      if (opts.persistence) {
        await setupPersistence();
      }

      if (opts.settings) {
        initializeSettings();
      }

      if (opts.miniTimer) {
        initializeMiniTimer();
      }

      if (opts.pomodoro) {
        loadPomodoroState();
      }

      if (opts.auth) {
        await initAuth();
      }
    };

    void run();
  }, []); // Empty deps - only run once on mount
}
