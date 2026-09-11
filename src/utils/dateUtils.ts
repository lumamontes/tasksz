/**
 * Date Utilities
 * Helper functions for handling local dates (YYYY-MM-DD format).
 * date-fns provides the parsing and calendar validation so we do not rely on
 * the browser's inconsistent Date string parsing behavior.
 */

import { format, isValid, parse } from 'date-fns';

/**
 * Format a Date object to YYYY-MM-DD string (local time, not UTC)
 */
export function formatDateLocal(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local time, not UTC).
 * Returns an Invalid Date only if the input is malformed.
 */
export function parseDateLocal(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(NaN);
  return parse(dateStr, 'yyyy-MM-dd', new Date(0));
}

/** True when a string is a real calendar date in YYYY-MM-DD format. */
export function isValidDateString(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = parseDateLocal(dateStr);
  return isValid(date) && format(date, 'yyyy-MM-dd') === dateStr;
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
