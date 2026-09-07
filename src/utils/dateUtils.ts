/**
 * Date Utilities
 * Helper functions for handling local dates (YYYY-MM-DD format)
 */

/**
 * Format a Date object to YYYY-MM-DD string (local time, not UTC)
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local time, not UTC).
 * Returns an Invalid Date only if the input is malformed.
 */
export function parseDateLocal(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(NaN);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** True when a YYYY-MM-DD string is well-formed (even if the date is not today). */
export function isValidDateString(dateStr: unknown): dateStr is string {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return formatDateLocal(new Date());
}

/**
 * Return a new Date offset by the given number of days
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Human-readable label for a YYYY-MM-DD date (pt-BR).
 * Never throws — returns the raw string if the date is malformed.
 */
export function formatDayLabel(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const today = getTodayString();

  if (dateStr === today) return 'Hoje';
  if (dateStr === formatDateLocal(addDays(new Date(), 1))) return 'Amanhã';
  if (dateStr === formatDateLocal(addDays(new Date(), -1))) return 'Ontem';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(parseDateLocal(dateStr));
  } catch {
    return dateStr;
  }
}

/**
 * Full human-readable label for a YYYY-MM-DD date (pt-BR).
 * Adds the calendar date to relative labels, e.g. "Hoje · 30 de agosto".
 */
export function formatDayLabelFull(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const label = formatDayLabel(dateStr);
  if (!['Hoje', 'Amanhã', 'Ontem'].includes(label)) return label;
  try {
    const full = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
    }).format(parseDateLocal(dateStr));
    return `${label} · ${full}`;
  } catch {
    return label;
  }
}

/**
 * Check if two date strings represent the same day
 */
export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}
