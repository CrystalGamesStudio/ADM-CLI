/**
 * TDD — /theme command
 *
 * Assumptions:
 * - Input: "theme" (no args) → list all themes; "theme <name>" → switch active theme
 * - Output: { output, shouldExit, shouldClear } via registry dispatch
 * - Boundary: invalid theme name, theme name that exists
 * - Mocks: none — uses real theme module (pure data, no I/O)
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/theme command', () => {
  let registry;
  let themeState;

  beforeEach(() => {
    themeState = { current: 'dark' };
    registry = createRegistry({ theme: themeState });
  });

  test('/theme with no args lists all 6 themes', async () => {
    const result = await registry.dispatch('theme');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/dark/);
    expect(result.output).toMatch(/light/);
    expect(result.output).toMatch(/cyberpunk/);
    expect(result.output).toMatch(/nord/);
    expect(result.output).toMatch(/forest/);
    expect(result.output).toMatch(/monokai/);
  });

  test('/theme cyberpunk switches active theme', async () => {
    const result = await registry.dispatch('theme cyberpunk');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/cyberpunk/i);
    expect(themeState.current).toBe('cyberpunk');
  });

  test('/theme nonexistent returns error', async () => {
    const result = await registry.dispatch('theme nonexistent');
    expect(result.output).toMatch(/Unknown theme/);
  });
});
