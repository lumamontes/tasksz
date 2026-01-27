/**
 * useKeyboardShortcut Hook
 * Handle keyboard shortcuts with proper cleanup
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
  ignoreInputs?: boolean; // Don't trigger when typing in inputs
}

/**
 * Register a keyboard shortcut handler
 * Automatically cleans up on unmount
 */
export function useKeyboardShortcut(
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const {
    key,
    ctrlKey = false,
    metaKey = false,
    altKey = false,
    shiftKey = false,
    preventDefault = true,
    enabled = true,
    ignoreInputs = true,
  } = options;

  // Use ref to avoid stale closures
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if typing in input/textarea
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (isTyping) return;
      }

      // Check modifiers
      if (event.ctrlKey !== ctrlKey) return;
      if (event.metaKey !== metaKey) return;
      if (event.altKey !== altKey) return;
      if (event.shiftKey !== shiftKey) return;

      // Check key
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      if (preventDefault) {
        event.preventDefault();
      }

      callbackRef.current(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrlKey, metaKey, altKey, shiftKey, preventDefault, enabled, ignoreInputs]);
}
