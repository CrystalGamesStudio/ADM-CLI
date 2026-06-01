/**
 * Assumptions:
 * - createSpinner(text, options?) wraps ora with theme colors
 * - Returns { start(), stop(), succeed(text?), fail(text?), text }
 * - Uses theme from resolveTheme
 * - Respects NO_COLOR / animations disabled
 */
const { createSpinner } = require('../../../src/ui/spinner');

describe('Spinner wrapper', () => {
  test('createSpinner returns an object with start, stop, succeed, fail methods', () => {
    const spinner = createSpinner('Loading...');
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
  });

  test('createSpinner sets text property', () => {
    const spinner = createSpinner('Thinking...');
    expect(spinner.text).toBe('Thinking...');
  });

  test('createSpinner accepts options object', () => {
    const spinner = createSpinner('Working', { color: 'yellow' });
    expect(spinner.text).toBe('Working');
  });

  test('createSpinner respects noColor option', () => {
    // Should not throw when color is disabled
    const spinner = createSpinner('No color', { noColor: true });
    expect(spinner.text).toBe('No color');
  });

  test('spinner methods are chainable', () => {
    const spinner = createSpinner('Chain', { isEnabled: false });
    const result = spinner.start();
    spinner.stop();
    expect(result).toBeDefined();
  });
});
