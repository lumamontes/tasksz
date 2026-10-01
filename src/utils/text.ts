/**
 * Text Utilities
 */

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#39;': "'",
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
};

/**
 * Convert HTML to plain text for previews.
 * Safe for SSR: no DOM access, pure string manipulation.
 */
export function htmlToPlainText(html: string): string {
  let text = html.replace(/<[^>]*>/g, ' ');

  for (const [entity, value] of Object.entries(HTML_ENTITIES)) {
    text = text.split(entity).join(value);
  }

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract up to two initials from a display name (used for avatars).
 * Safe for SSR: no DOM access.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
/** "1 tarefa" / "3 tarefas". */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
