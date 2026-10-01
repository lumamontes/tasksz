/**
 * Dialog Component
 * Modal shell rendered on document.body: traps focus, restores it on close, closes on Escape or
 * backdrop click, and keeps key presses from reaching window-level shortcuts
 * of the panels underneath.
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  role?: 'dialog' | 'alertdialog';
  /** Id of the element that describes the dialog, for alert dialogs. */
  describedBy?: string;
}

export function Dialog({ title, subtitle, onClose, children, role = 'dialog', describedBy }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Read during the first render: autoFocus inside the dialog moves focus
  // before effects run.
  const [returnFocusTo] = useState(() => (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null));

  useEffect(() => {
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => returnFocusTo?.focus();
  }, [returnFocusTo]);

  // React handlers inside the dialog run first; stopping here keeps the key
  // from reaching window-level shortcuts of the panels underneath.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    // Focusables are read on each Tab because dialog content can change.
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Portaled so ancestor styles (opacity, transforms, overflow) never affect
  // the modal; React events still bubble to the opener, so clicks stop here.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-theme-border bg-theme-panel p-6 text-left shadow-2xl focus:outline-none"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {subtitle && <p className="text-xs text-theme-muted">{subtitle}</p>}
            <h2 id={titleId} className={`${subtitle ? 'mt-1 ' : ''}text-lg font-semibold text-theme-text`}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1 text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
