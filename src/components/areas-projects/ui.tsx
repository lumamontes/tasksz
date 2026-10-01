/**
 * Presentational building blocks shared by the Areas and Projects screens.
 * They hold no domain state; callers pass data and handlers.
 */

import type { ReactNode } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';

export function ColorDot({ color, size = 'md' }: { color?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 rounded-full ${size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'}`}
      style={{ backgroundColor: color || 'var(--theme-accent)' }}
    />
  );
}

export function SearchField({ label, value, onChange, tone = 'panel' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tone?: 'panel' | 'bg';
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-theme-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className={`w-full rounded-lg border border-theme-border py-2 pl-9 pr-3 text-sm text-theme-text outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 ${tone === 'panel' ? 'bg-theme-panel' : 'bg-theme-bg'}`}
      />
    </label>
  );
}

export function PrimaryButton({ onClick, icon, children, label }: {
  onClick: () => void;
  icon?: ReactNode;
  children?: ReactNode;
  /** Accessible name for icon-only buttons. */
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-theme-accent text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 ${children ? 'px-3 py-2' : 'p-2'}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function BackLink({ onClick, children, className = 'mb-5' }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${className} rounded text-sm text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent`}>
      <span aria-hidden="true">← </span><span className="sr-only">Voltar para </span>{children}
    </button>
  );
}

export function EntityHeader({ eyebrow, title, description, color, editLabel, deleteLabel, editing, onEdit, onDelete }: {
  eyebrow: string;
  title: string;
  description: string;
  color?: string;
  editLabel: string;
  deleteLabel: string;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {color && <ColorDot color={color} />}
          <p className="text-xs font-medium uppercase tracking-widest text-theme-muted">{eyebrow}</p>
        </div>
        <h2 tabIndex={-1} className="mt-2 break-words text-2xl font-semibold text-theme-text focus:outline-none">{title}</h2>
        <p className="mt-1 text-sm text-theme-muted">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onEdit} aria-pressed={editing} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent" aria-label={editLabel} title={editLabel}><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} className="rounded-lg p-2 text-theme-muted hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label={deleteLabel} title={deleteLabel}><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-bg p-4">
      <p className="text-2xl font-semibold text-theme-text">{value}</p>
      <p className="mt-1 text-xs text-theme-muted">{label}</p>
    </div>
  );
}

export function ListCard({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="divide-y divide-theme-border overflow-hidden rounded-xl border border-theme-border bg-theme-bg">
      {children}
    </ul>
  );
}

export function ListRow({ onClick, leading, title, meta, trailing, selected }: {
  onClick: () => void;
  leading?: ReactNode;
  title: string;
  meta?: string;
  trailing?: string;
  selected?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={selected || undefined}
       className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-accent ${selected ? 'bg-theme-accent/10' : 'hover:bg-theme-sidebar'}`}
      >
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-theme-text">{title}</span>
          {meta && <span className="mt-0.5 block text-xs text-theme-muted">{meta}</span>}
        </span>
        {trailing && <span className="text-xs text-theme-muted">{trailing}</span>}
      </button>
    </li>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <li className="p-6 text-sm text-theme-muted">{children}</li>;
}
