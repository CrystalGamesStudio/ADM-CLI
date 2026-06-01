/**
 * Assumptions:
 * - Quotes is a static array of { text: string, author: string }
 * - getRandomQuote() returns a single quote from the array
 * - getAllQuotes() returns the full array
 * - Each quote has non-empty text and non-empty author
 * - Array has at least 10 entries for variety
 */
const { getRandomQuote, getAllQuotes } = require('../../../src/utils/quotes');

describe('Quotes module', () => {
  test('getRandomQuote returns a quote with text and author', () => {
    const quote = getRandomQuote();
    expect(quote).toBeDefined();
    expect(typeof quote.text).toBe('string');
    expect(typeof quote.author).toBe('string');
    expect(quote.text.length).toBeGreaterThan(0);
    expect(quote.author.length).toBeGreaterThan(0);
  });

  test('getAllQuotes returns an array with at least 10 entries', () => {
    const quotes = getAllQuotes();
    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThanOrEqual(10);
  });

  test('every quote has valid text and author', () => {
    const quotes = getAllQuotes();
    quotes.forEach((q, i) => {
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('author');
      expect(typeof q.text).toBe('string');
      expect(q.text.length).toBeGreaterThan(0);
      expect(typeof q.author).toBe('string');
      expect(q.author.length).toBeGreaterThan(0);
    });
  });

  test('getRandomQuote returns a quote from the collection', () => {
    const all = getAllQuotes();
    const quote = getRandomQuote();
    expect(all).toContainEqual(quote);
  });
});
