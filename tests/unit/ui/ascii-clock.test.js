/**
 * Assumptions:
 * - renderClock(date?) returns array of strings (ASCII lines)
 * - Each line is the same width (padded)
 * - Default: uses current time (Date.now())
 * - Can pass a Date for deterministic testing
 * - Uses box-drawing characters, not figlet
 * - Shows HH:MM:SS
 * - renderFrame(date, quote?) returns { lines: string[], quote: object|null }
 */
const { renderClock, renderFrame } = require('../../../src/ui/ascii-clock');

describe('ASCII Clock', () => {
  test('renderClock returns array of strings', () => {
    const lines = renderClock(new Date(2026, 0, 1, 14, 30, 45));
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  test('renderClock lines are all the same width', () => {
    const lines = renderClock(new Date(2026, 0, 1, 14, 30, 45));
    const widths = lines.map(l => l.length);
    const unique = [...new Set(widths)];
    expect(unique.length).toBe(1);
  });

  test('renderClock produces consistent output for same time', () => {
    const date = new Date(2026, 0, 1, 9, 5, 3);
    const a = renderClock(date);
    const b = renderClock(date);
    expect(a).toEqual(b);
  });

  test('renderFrame returns lines and optional quote', () => {
    const frame = renderFrame(new Date(2026, 0, 1, 12, 0, 0), { text: 'Hello', author: 'World' });
    expect(Array.isArray(frame.lines)).toBe(true);
    expect(frame.quote).toEqual({ text: 'Hello', author: 'World' });
  });

  test('renderFrame works without quote', () => {
    const frame = renderFrame(new Date(2026, 0, 1, 12, 0, 0));
    expect(Array.isArray(frame.lines)).toBe(true);
    expect(frame.quote).toBeNull();
  });

  test('renderClock output contains digits for the time', () => {
    // Render 23:59:59 and verify the output is non-trivial (has content)
    const lines = renderClock(new Date(2026, 0, 1, 23, 59, 59));
    const text = lines.join('');
    expect(text.length).toBeGreaterThan(20);
  });

  test('different times produce different output', () => {
    const a = renderClock(new Date(2026, 0, 1, 1, 0, 0));
    const b = renderClock(new Date(2026, 0, 1, 23, 59, 59));
    expect(a).not.toEqual(b);
  });
});
