/**
 * ResizableHandle Component (island)
 * Self-contained draggable separator. Reads/writes shared panel width
 * through the layout store so the task list island reacts independently.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $isResizing,
  $leftPanelWidth,
  loadLeftPanelWidth,
  setLeftPanelWidth,
  saveLeftPanelWidth,
  setIsResizing,
  MIN_LEFT_WIDTH,
  MAX_LEFT_WIDTH,
} from '../../stores/layoutStore';
import { GripVertical } from 'lucide-react';

export function ResizableHandle() {
  const isResizing = useStore($isResizing);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const bodyClassesApplied = useRef(false);

  // Restore the user's preferred width on mount
  useEffect(() => {
    loadLeftPanelWidth();
  }, []);

  // Toggle body resize helpers
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('resize-cursor-active', 'resize-no-select');
      bodyClassesApplied.current = true;
    } else if (bodyClassesApplied.current) {
      document.body.classList.remove('resize-cursor-active', 'resize-no-select');
      bodyClassesApplied.current = false;
    }
  }, [isResizing]);

  // Drag listeners while resizing
  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      setLeftPanelWidth(startWidth.current + (e.clientX - startX.current));
    };
    const onUp = () => {
      saveLeftPanelWidth();
      setIsResizing(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startWidth.current = $leftPanelWidth.get();
    setIsResizing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const current = $leftPanelWidth.get();
    let next: number | null = null;

    if (e.key === 'ArrowLeft') next = current - 10;
    else if (e.key === 'ArrowRight') next = current + 10;
    else if (e.key === 'Home') next = MIN_LEFT_WIDTH;
    else if (e.key === 'End') next = MAX_LEFT_WIDTH;

    if (next !== null) {
      e.preventDefault();
      setLeftPanelWidth(next);
      saveLeftPanelWidth();
    }
  };

  return (
    <div
      className={`
        relative flex items-center justify-center group cursor-col-resize shrink-0 w-[18px] bg-theme-border
        transition-colors duration-200
        ${isResizing
          ? 'bg-theme-accent/25'
          : 'hover:bg-theme-accent/20'
        }
      `}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar painéis - use setas do teclado ou arraste"
      title="Arraste para redimensionar os painéis ou use as setas do teclado"
    >
      {/* Invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />

      {/* Visual grip indicator (stays inside the fixed-width strip) */}
      <div
        className={`
          absolute inset-y-0 flex items-center justify-center
          transition-opacity duration-200
          ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <GripVertical
          className={`
            w-4 h-4 transition-colors duration-200
            ${isResizing ? 'text-theme-accent' : 'text-theme-muted/60 group-hover:text-theme-accent/80'}
          `}
        />
      </div>

      {/* Focus indicator */}
      <div
        className={`
          absolute inset-0 rounded-sm transition-all duration-200
          focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2
        `}
      />
    </div>
  );
}