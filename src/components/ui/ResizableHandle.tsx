/**
 * ResizableHandle Component
 * A draggable handle for resizing panels
 */

import { GripVertical } from 'lucide-react';

interface ResizableHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isResizing: boolean;
}

export function ResizableHandle({ onMouseDown, onKeyDown, isResizing }: ResizableHandleProps) {
  return (
    <div
      className={`
        relative flex items-center justify-center group cursor-col-resize transition-all duration-200 bg-theme-border
        ${isResizing 
          ? 'w-4 bg-theme-accent shadow-lg' 
          : 'w-3 hover:w-4 hover:bg-theme-accent/50'
        }
      `}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar painéis - use setas do teclado ou arraste"
      title="Arraste para redimensionar os painéis ou use as setas do teclado"
    >
      {/* Invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
      
      {/* Visual grip indicator */}
      <div
        className={`
          absolute inset-y-0 flex items-center justify-center transition-all duration-200
          ${isResizing || 'group-hover:opacity-100 opacity-0'}
        `}
      >
        <GripVertical 
          className={`
            w-4 h-4 text-theme-muted/60 transition-colors duration-200
            ${isResizing ? 'text-theme-accent' : 'group-hover:text-theme-accent/80'}
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