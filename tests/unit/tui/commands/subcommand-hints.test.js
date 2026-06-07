/**
 * TDD — Slice 6: Subcommand placeholder hints
 *
 * Assumptions:
 * - Input: command name string (no '/' prefix) passed to getSubcommands()
 * - Output: string[] of subcommand names, or undefined/null if none
 * - Boundary: unknown command, command with no subcommands, command with subcommands
 * - Placeholder: only shown when input matches "/command " (trailing space), hidden otherwise
 * - NOT tested: tab-autocomplete of subcommands, subcommand validation, execution logic
 */
const { createRegistry, getPlaceholderText } = require('../../../../src/tui/commands/registry');

describe('getSubcommands', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('returns subcommands for github', () => {
    const subs = registry.getSubcommands('github');
    expect(subs).toEqual(['status', 'pr', 'issue', 'commit']);
  });

  test('returns subcommands for connect', () => {
    const subs = registry.getSubcommands('connect');
    expect(subs).toEqual(['github', 'gitlab', 'list', 'disconnect']);
  });

  test('returns subcommands for model', () => {
    const subs = registry.getSubcommands('model');
    expect(subs).toEqual(['<provider-id>']);
  });

  test('returns subcommands for mr', () => {
    expect(registry.getSubcommands('mr')).toEqual(['list', 'draft', 'comment']);
  });

  test('returns subcommands for dotfiles', () => {
    expect(registry.getSubcommands('dotfiles')).toEqual(['sync']);
  });

  test('returns undefined for help (no subcommands)', () => {
    expect(registry.getSubcommands('help')).toBeUndefined();
  });

  test('returns undefined for unknown command', () => {
    expect(registry.getSubcommands('unknown')).toBeUndefined();
  });
});

describe('getPlaceholderText', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('returns formatted placeholder for /github (with trailing space)', () => {
    const text = getPlaceholderText('/github ', registry.getSubcommands);
    expect(text).toBe('<status, pr, issue, commit>');
  });

  test('returns formatted placeholder for /connect (with trailing space)', () => {
    const text = getPlaceholderText('/connect ', registry.getSubcommands);
    expect(text).toBe('<github, gitlab, list, disconnect>');
  });

  test('returns null when input has no trailing space', () => {
    const text = getPlaceholderText('/github', registry.getSubcommands);
    expect(text).toBeNull();
  });

  test('returns null when input has text after the space', () => {
    const text = getPlaceholderText('/github sta', registry.getSubcommands);
    expect(text).toBeNull();
  });

  test('returns null for command without subcommands', () => {
    const text = getPlaceholderText('/help ', registry.getSubcommands);
    expect(text).toBeNull();
  });

  test('returns null for unknown command', () => {
    const text = getPlaceholderText('/foobar ', registry.getSubcommands);
    expect(text).toBeNull();
  });

  test('returns null for empty input', () => {
    const text = getPlaceholderText('', registry.getSubcommands);
    expect(text).toBeNull();
  });

  test('returns null for non-command input', () => {
    const text = getPlaceholderText('hello world', registry.getSubcommands);
    expect(text).toBeNull();
  });
});
