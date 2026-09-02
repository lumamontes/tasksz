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