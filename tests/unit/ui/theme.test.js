/**
 * Assumptions:
 * - resolveTheme(config) takes a config object and returns a resolved color map
 * - Config can have: { theme: 'dark' | 'light' | 'auto' | { primary, secondary, ... } }
 * - Default theme is 'auto' if not specified
 * - Returns: { name, colors: { primary, secondary, accent, text, bg, muted, error, success, warning } }
 * - Colors are hex strings like '#ff0000'
 * - getTheme(name) returns a preset theme by name
 * - Built-in themes: 'dark', 'light'
 */
const { resolveTheme, getTheme } = require('../../../src/ui/theme');

describe('Theme manager', () => {
  test('resolveTheme returns dark theme when config specifies dark', () => {
    const result = resolveTheme({ theme: 'dark' });
    expect(result.name).toBe('dark');
    expect(result.colors).toBeDefined();
    expect(result.colors.primary).toBeDefined();
    expect(typeof result.colors.primary).toBe('string');
  });

  test('resolveTheme returns light theme when config specifies light', () => {
    const result = resolveTheme({ theme: 'light' });
    expect(result.name).toBe('light');
    expect(result.colors).toBeDefined();
    expect(result.colors.primary).toBeDefined();
  });

  test('resolveTheme defaults to auto when theme not specified', () => {
    const result = resolveTheme({});
    expect(result.name).toMatch(/^(dark|light)$/);
    expect(result.colors).toBeDefined();
  });

  test('resolveTheme accepts custom theme object', () => {
    const custom = { primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff', text: '#ffffff', bg: '#000000', muted: '#888888', error: '#ff4444', success: '#44ff44', warning: '#ffff44' };
    const result = resolveTheme({ theme: custom });
    expect(result.name).toBe('custom');
    expect(result.colors.primary).toBe('#ff0000');
    expect(result.colors.accent).toBe('#0000ff');
  });

  test('resolveTheme merges custom partial theme with dark defaults', () => {
    const partial = { primary: '#ff0000' };
    const result = resolveTheme({ theme: partial });
    expect(result.name).toBe('custom');
    expect(result.colors.primary).toBe('#ff0000');
    expect(result.colors.secondary).toBeDefined();
    expect(result.colors.text).toBeDefined();
  });

  test('getTheme returns dark preset', () => {
    const dark = getTheme('dark');
    expect(dark.name).toBe('dark');
    expect(dark.colors).toBeDefined();
  });

  test('getTheme returns light preset', () => {
    const light = getTheme('light');
    expect(light.name).toBe('light');
    expect(light.colors).toBeDefined();
  });

  test('getTheme throws on unknown preset name', () => {
    expect(() => getTheme('neon')).toThrow();
  });

  test('dark and light themes have all required color keys', () => {
    const requiredKeys = ['primary', 'secondary', 'accent', 'text', 'bg', 'muted', 'error', 'success', 'warning'];
    for (const name of ['dark', 'light']) {
      const theme = getTheme(name);
      for (const key of requiredKeys) {
        expect(theme.colors).toHaveProperty(key);
      }
    }
  });
});
