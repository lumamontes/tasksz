/**
 * Mini Timer UI Store
 * Manages the detachable pomodoro timer UI state
 */

import { atom } from 'nanostores';

export interface MiniTimerPosition {
  x: number;
  y: number;
}

export interface MiniTimerState {
  miniEnabled: boolean;
  miniCollapsed: boolean;
  miniPosition: MiniTimerPosition | null;
  popupEnabled: boolean;
  popupWindow: Window | null;
}

// Default state
const defaultState: MiniTimerState = {
  miniEnabled: false,
  miniCollapsed: false,
  miniPosition: null,
  popupEnabled: false,
  popupWindow: null,
};

// State atom
export const $miniTimer = atom<MiniTimerState>(defaultState);

// Load from localStorage
export function loadMiniTimerState(): MiniTimerState {
  if (typeof window === 'undefined') return defaultState;
  
  try {
    const stored = localStorage.getItem('tarefitas_v1_miniTimer');
    if (!stored) return defaultState;
    
    const parsed = JSON.parse(stored);
    return {
      ...defaultState,
      ...parsed,
      popupWindow: null, // Never persist window reference
    };
  } catch (error) {
    console.error('Failed to load mini timer state:', error);
    return defaultState;
  }
}

// Save to localStorage
export function saveMiniTimerState(state: MiniTimerState) {
  if (typeof window === 'undefined') return;
  
  try {
    const toSave = {
      ...state,
      popupWindow: null, // Never persist window reference
    };
    localStorage.setItem('tarefitas_v1_miniTimer', JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save mini timer state:', error);
  }
}

// Initialize from localStorage
export function initializeMiniTimer() {
  const loaded = loadMiniTimerState();
  $miniTimer.set(loaded);
  
  // Subscribe to changes and auto-save
  $miniTimer.subscribe((state) => {
    saveMiniTimerState(state);
  });
}

// Action functions
export function enableMiniTimer() {
  const current = $miniTimer.get();
  $miniTimer.set({
    ...current,
    miniEnabled: true,
  });
}

export function disableMiniTimer() {
  const current = $miniTimer.get();
  $miniTimer.set({
    ...current,
    miniEnabled: false,
    popupEnabled: false,
    popupWindow: null,
  });
}

export function toggleMiniTimerCollapsed() {
  const current = $miniTimer.get();
  $miniTimer.set({
    ...current,
    miniCollapsed: !current.miniCollapsed,
  });
}

export function setMiniTimerPosition(position: MiniTimerPosition) {
  const current = $miniTimer.get();
  $miniTimer.set({
    ...current,
    miniPosition: position,
  });
}

export function setPopupWindow(window: Window | null) {
  const current = $miniTimer.get();
  $miniTimer.set({
    ...current,
    popupWindow: window,
    popupEnabled: window !== null,
  });
}

// Open popup window with fallback to in-app mini timer
export function openPopupWindow(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if popup is already open
  const current = $miniTimer.get();
  if (current.popupWindow && !current.popupWindow.closed) {
    current.popupWindow.focus();
    return true;
  }

  // Try to open popup window
  const popup = window.open(
    '/pomodoro/popup',
    'pomodoro-timer',
    'width=320,height=400,resizable=yes,scrollbars=no,toolbar=no,menubar=no'
  );

  if (popup) {
    setPopupWindow(popup);
    
    // Monitor if popup is closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setPopupWindow(null);
        // Timer continues in main app - no need for intrusive message
      }
    }, 1000);

    return true;
  } else {
    // Popup blocked - fallback to in-app mini timer
    enableMiniTimer();
    return false;
  }
}
