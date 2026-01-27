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
 * Parse a YYYY-MM-DD string to a Date object (local time, not UTC)
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return formatDateLocal(new Date());
}

/**
 * Check if two date strings represent the same day
 */
export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}
