/**
 * useResizablePanels Hook
 * Provides functionality for resizable panels with draggable separator
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizablePanelsProps {
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  storageKey?: string;
}

export function useResizablePanels({
  defaultLeftWidth = 320,
  minLeftWidth = 280,
  maxLeftWidth = 600,
  storageKey = 'panel-sizes'
}: UseResizablePanelsProps = {}) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const width = parseInt(saved, 10);
        if (width >= minLeftWidth && width <= maxLeftWidth) {
          setLeftPanelWidth(width);
        }
      }
    }
  }, [minLeftWidth, maxLeftWidth, storageKey]);

  // Save width to localStorage
  const saveWidth = useCallback((width: number) => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [storageKey]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.classList.add('resize-cursor-active', 'resize-no-select');
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Clamp width within bounds
    const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
    
    setLeftPanelWidth(clampedWidth);
  }, [isResizing, minLeftWidth, maxLeftWidth]);

  const stopResize = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.classList.remove('resize-cursor-active', 'resize-no-select');
      saveWidth(leftPanelWidth);
    }
  }, [isResizing, leftPanelWidth, saveWidth]);

  // Mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, resize, stopResize]);

  // Keyboard support for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newWidth = Math.max(minLeftWidth, leftPanelWidth - 10);
      setLeftPanelWidth(newWidth);
      saveWidth(newWidth);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newWidth = Math.min(maxLeftWidth, leftPanelWidth + 10);
      setLeftPanelWidth(newWidth);
      saveWidth(newWidth);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setLeftPanelWidth(minLeftWidth);
      saveWidth(minLeftWidth);
    } else if (e.key === 'End') {
      e.preventDefault();
      setLeftPanelWidth(maxLeftWidth);
      saveWidth(maxLeftWidth);
    }
  }, [leftPanelWidth, minLeftWidth, maxLeftWidth, saveWidth]);

  return {
    leftPanelWidth,
    isResizing,
    containerRef,
    startResize,
    handleKeyDown,
    // Reset function for programmatic control
    resetToDefault: () => {
      setLeftPanelWidth(defaultLeftWidth);
      saveWidth(defaultLeftWidth);
    }
  };
}