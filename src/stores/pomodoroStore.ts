/**
 * Pomodoro Timer Store
 * Enhanced for the new Tarefitas app structure
 */

import { atom } from 'nanostores';
import { $settings } from './settingsStore';
import type { PomodoroSession } from '../types';

// Timer state
export const $minutes = atom(25);
export const $seconds = atom(0);
export const $mode = atom<'focus' | 'break' | 'longBreak'>('focus');
export const $isActive = atom(false);
export const $hasFinished = atom(false);
export const $completedCycles = atom(0);
export const $completedFocusSessions = atom(0);
export const $currentTaskId = atom<string | null>(null);
export const $sessions = atom<PomodoroSession[]>([]);

// Get durations from settings
function getDurations() {
  const settings = $settings.get();
  return {
    focus: settings.pomodoro.focusMinutes,
    break: settings.pomodoro.shortBreakMinutes,
    longBreak: settings.pomodoro.longBreakMinutes,
  };
}

// DURATIONS constant - fallback if settings not available
const DEFAULT_DURATIONS = {
  focus: 25,
  break: 5,
  longBreak: 15,
};

// Timer interval reference
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Initialize the store
export function initializeStore() {
  const mode = $mode.get();
  const durations = getDurations();
  const duration = durations[mode] || DEFAULT_DURATIONS[mode];
  $minutes.set(duration);
  $seconds.set(0);
  $isActive.set(false);
  $hasFinished.set(false);
}

// Set mode and update timer
export function setMode(mode: 'focus' | 'break' | 'longBreak') {
  // Don't change mode if timer is active
  if ($isActive.get()) return;
  
  $mode.set(mode);
  const durations = getDurations();
  const duration = durations[mode] || DEFAULT_DURATIONS[mode];
  $minutes.set(duration);
  $seconds.set(0);
  $hasFinished.set(false);
}

// Start countdown
export function startCountdown() {
  // Clear any existing timer first to prevent duplicates
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if ($isActive.get()) return;
  
  $isActive.set(true);
  $hasFinished.set(false);
  
  timerInterval = setInterval(() => {
    const currentMinutes = $minutes.get();
    const currentSeconds = $seconds.get();
    
    if (currentMinutes === 0 && currentSeconds === 0) {
      // Timer finished
      clearInterval(timerInterval!);
      timerInterval = null;
      $isActive.set(false);
      $hasFinished.set(true);
      
      // If it was a focus session, increment completed sessions
      if ($mode.get() === 'focus') {
        $completedFocusSessions.set($completedFocusSessions.get() + 1);
      }
      
      // Soft notification - only if sound is enabled and user wants notifications
      // No forced sound - just a gentle text cue via notification if permission granted
      const currentSettings = $settings.get();
      if (currentSettings.soundEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const mode = $mode.get();
        const title = mode === 'focus' ? 'Sessão de foco concluída' : 'Pausa finalizada';
        new Notification(title, { 
          body: mode === 'focus' ? 'Tempo para uma pausa' : 'Pronto para focar novamente?',
          icon: '/favicon.ico',
          silent: true // No sound, just visual notification
        });
      }
      
      return;
    }
    
    if (currentSeconds > 0) {
      $seconds.set(currentSeconds - 1);
    } else {
      $minutes.set(currentMinutes - 1);
      $seconds.set(59);
    }
  }, 1000);
}

// Pause countdown
export function pauseCountdown() {
  if (!$isActive.get()) return;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  $isActive.set(false);
}

// Reset countdown
export function resetCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  $isActive.set(false);
  $hasFinished.set(false);
  
  // Reset to current mode's duration
  const mode = $mode.get();
  const durations = getDurations();
  const duration = durations[mode] || DEFAULT_DURATIONS[mode];
  $minutes.set(duration);
  $seconds.set(0);
}

// Move to next mode
export function nextMode() {
  const currentMode = $mode.get();
  const completedSessions = $completedFocusSessions.get();
  
  let nextModeValue: 'focus' | 'break' | 'longBreak';
  
  if (currentMode === 'focus') {
    // After a focus session, determine break type
    if (completedSessions % 4 === 0) {
      nextModeValue = 'longBreak';
    } else {
      nextModeValue = 'break';
    }
  } else {
    // After any break, go back to focus
    nextModeValue = 'focus';
  }
  
  setMode(nextModeValue);
  $hasFinished.set(false);
}

// Request notification permission if available
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Persist pomodoro state to localStorage for cross-window sync
const POMODORO_STORAGE_KEY = 'tarefitas_v1_pomodoroState';
let pomodoroStateLoaded = false; // Prevent multiple loads in same window
let lastSaveTime = 0; // Throttle saves to prevent excessive writes

export function savePomodoroState() {
  if (typeof window === 'undefined') return;
  
  // Throttle saves to once per second to prevent lag
  const now = Date.now();
  if (now - lastSaveTime < 1000) return;
  lastSaveTime = now;
  
  try {
    const state = {
      minutes: $minutes.get(),
      seconds: $seconds.get(),
      mode: $mode.get(),
      isActive: $isActive.get(),
      hasFinished: $hasFinished.get(),
      completedFocusSessions: $completedFocusSessions.get(),
      timestamp: Date.now(),
    };
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save pomodoro state:', error);
  }
}

export function loadPomodoroState() {
  if (typeof window === 'undefined') return false;
  
  // Prevent multiple loads - only load once per session
  if (pomodoroStateLoaded) return false;
  
  try {
    const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!stored) {
      pomodoroStateLoaded = true; // Mark as loaded even if no state exists
      return false;
    }
    
    const state = JSON.parse(stored);
    const age = Date.now() - (state.timestamp || 0);
    
    // Only load if state is recent (less than 1 minute old)
    // This prevents loading stale state after page reload
    if (age > 60000) {
      pomodoroStateLoaded = true;
      return false;
    }
    
    $minutes.set(state.minutes);
    $seconds.set(state.seconds);
    $mode.set(state.mode);
    $hasFinished.set(state.hasFinished);
    $completedFocusSessions.set(state.completedFocusSessions || 0);
    
    // Only set isActive if timer is not already running
    // This prevents conflicts when multiple windows are open
    if (!timerInterval) {
      $isActive.set(state.isActive);
      
      // If timer was active, restart it (but only if no timer is already running)
      if (state.isActive && !state.hasFinished) {
        startCountdown();
      }
    }
    
    pomodoroStateLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load pomodoro state:', error);
    pomodoroStateLoaded = true;
    return false;
  }
}

// Auto-save pomodoro state on changes (throttled)
if (typeof window !== 'undefined') {
  // Use a single throttled save function to prevent excessive writes
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  const throttledSave = () => {
    if (saveTimeout) return;
    saveTimeout = setTimeout(() => {
      savePomodoroState();
      saveTimeout = null;
    }, 100); // Debounce saves to every 100ms
  };
  
  $minutes.subscribe(throttledSave);
  $seconds.subscribe(throttledSave);
  $mode.subscribe(throttledSave);
  $isActive.subscribe(throttledSave);
  $hasFinished.subscribe(throttledSave);
  $completedFocusSessions.subscribe(throttledSave);
  
  // Listen for storage events (cross-window sync)
  window.addEventListener('storage', (e) => {
    if (e.key === POMODORO_STORAGE_KEY && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        const age = Date.now() - (state.timestamp || 0);
        
        // Only sync if state is recent
        if (age < 60000) {
          $minutes.set(state.minutes);
          $seconds.set(state.seconds);
          $mode.set(state.mode);
          
          // Don't sync isActive to avoid conflicts with running timers
          // Only sync if timer was just started/stopped and no timer is currently running
          if (state.isActive !== $isActive.get()) {
            if (state.isActive && !timerInterval && !$isActive.get()) {
              // Only start if we're not already active and no timer exists
              startCountdown();
            } else if (!state.isActive && timerInterval) {
              // Pause if timer is running but state says it should be paused
              pauseCountdown();
            }
          }
          
          $hasFinished.set(state.hasFinished);
          $completedFocusSessions.set(state.completedFocusSessions || 0);
        }
      } catch (error) {
        console.error('Failed to sync pomodoro state:', error);
      }
    }
  });
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    savePomodoroState();
  });
}