/**
 * TaskUndoToast Component
 * Shows undo notification for task actions (archive/delete)
 */

import { useState, useEffect } from 'react';

interface TaskUndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function TaskUndoToast({ message, onUndo, onDismiss, duration = 10000 }: TaskUndoToastProps) {
  const [show, setShow] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setShow(false);
      setTimeout(() => onDismiss(), 300); // Wait for fade out
    }, duration);
    setTimeoutId(id);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleUndo = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setShow(false);
    setTimeout(() => {
      onUndo();
      onDismiss();
    }, 300);
  };

  const handleDismiss = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setShow(false);
    setTimeout(() => onDismiss(), 300);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="bg-theme-accent text-white px-4 py-3 rounded-lg shadow-lg border border-theme-border flex items-center gap-3 min-w-72">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        
        <div className="flex-1">
          <div className="font-medium text-sm">{message}</div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Desfazer
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
