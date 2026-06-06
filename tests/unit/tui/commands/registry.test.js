/**
 * TDD — Command Registry: dispatch + autocomplete
 *
 * Assumptions:
 * - Input: raw string, may or may not have '/' prefix — registry strips it
 * - Output: { output: string, shouldExit: boolean, shouldClear: boolean }
 * - Boundary: empty string, whitespace, unknown command, close typo match
 * - NOT tested here: AI mode, streaming, git integration beyond /status, plugins
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('Command Registry — dispatch', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('empty input returns empty output', async () => {
    const result = await registry.dispatch('');
    expect(result.output).toBe('');
    expect(result.shouldExit).toBe(false);
    expect(result.shouldClear).toBe(false);
  });

  test('whitespace-only input returns empty output', async () => {
    const result = await registry.dispatch('   ');
    expect(result.output).toBe('');
    expect(result.shouldExit).toBe(false);
  });

  test('/help lists all registered commands with descriptions', async () => {
    const result = await registry.dispatch('help');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/help/);
    expect(result.output).toMatch(/exit/);
    expect(result.output).toMatch(/clear/);
    expect(result.output).toMatch(/theme/);
    expect(result.output).toMatch(/status/);
  });

  test('/exit signals the shell should stop', async () => {
    const result = await registry.dispatch('exit');
    expect(result.shouldExit).toBe(true);
    expect(result.output).toBeTruthy();
  });

  test('/clear signals message history should be wiped', async () => {
    const result = await registry.dispatch('clear');
    expect(result.shouldClear).toBe(true);
    expect(result.shouldExit).toBe(false);
  });

  test('unknown command returns error message', async () => {
    const result = await registry.dispatch('foobar');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/Unknown command/);
  });

  test('/hlep suggests /help as correction', async () => {
    const result = await registry.dispatch('hlep');
    expect(result.output).toMatch(/Did you mean.*help/i);
  });

  test('completely unrelated typo shows generic error without suggestion', async () => {
    const result = await registry.dispatch('zzzzzzzz');
    expect(result.output).toMatch(/Unknown command/);
    expect(result.output).not.toMatch(/Did you mean/);
  });

  test('/plugins returns unknown command (Issue #11)', async () => {
    const result = await registry.dispatch('plugins');
    expect(result.output).toMatch(/Unknown command/);
  });

  test('/config returns unknown command (Issue #11)', async () => {
    const result = await registry.dispatch('config');
    expect(result.output).toMatch(/Unknown command/);
  });
});

describe('Command Registry — autocomplete', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('empty partial returns all command names', () => {
    const matches = registry.autocomplete('');
    expect(matches).toContain('help');
    expect(matches).toContain('exit');
    expect(matches).toContain('clear');
    expect(matches).toContain('theme');
    expect(matches).toContain('status');
  });

  test('partial "he" matches help', () => {
    const matches = registry.autocomplete('he');
    expect(matches).toEqual(['help']);
  });

  test('partial "c" matches clear, connect, and commit', () => {
    const matches = registry.autocomplete('c');
    expect(matches).toContain('clear');
    expect(matches).toContain('connect');
    expect(matches).toContain('commit');
  });

  test('no match returns empty array', () => {
    const matches = registry.autocomplete('xyz');
    expect(matches).toEqual([]);
  });
});
