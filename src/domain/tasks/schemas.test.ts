import { describe, expect, it } from 'vitest';
import { isValidTaskDateRange } from './schemas';

describe('isValidTaskDateRange', () => {
  it('accepts an empty or ordered range', () => {
    expect(isValidTaskDateRange()).toBe(true);
    expect(isValidTaskDateRange('2026-09-01')).toBe(true);
    expect(isValidTaskDateRange('2026-09-01', '2026-09-03')).toBe(true);
    expect(isValidTaskDateRange('2026-09-03', '2026-09-03')).toBe(true);
  });

  it('rejects an inverted range', () => {
    expect(isValidTaskDateRange('2026-09-04', '2026-09-03')).toBe(false);
  });
});
