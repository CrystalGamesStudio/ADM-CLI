/**
 * TDD — TUI App logic (state management, command integration)
 *
 * Assumptions:
 * - App state: { messages, theme, aiMode, version }
 * - createAppState() returns state + processInput() to handle commands
 * - StatusBar data: theme name, AI status, version — derived from state
 * - Welcome message added on init
 * - Mocks: none for state logic — pure functions
 * - NOT tested: ink rendering, keyboard events, AI mode toggle
 */
const { createAppState } = require('../../../src/tui/app-state');

describe('TUI App state', () => {
  test('initializes with welcome message containing /help', () => {
    const state = createAppState();
    expect(state.messages.length).toBeGreaterThan(0);
    const welcome = state.messages[0];
    expect(welcome.text).toMatch(/welcome/i);
    expect(welcome.text).toMatch(/\/help/);
  });

  test('statusBar data shows theme, AI off, and version', () => {
    const state = createAppState();
    const bar = state.getStatusBar();
    expect(bar.themeName).toBeTruthy();
    expect(bar.aiMode).toBe(false);
    expect(bar.version).toMatch(/v0\.2\.0/);
  });

  test('processInput adds command output to messages', async () => {
    const state = createAppState();
    await state.processInput('help');
    // welcome + help output
    expect(state.messages.length).toBeGreaterThanOrEqual(2);
    const helpMsg = state.messages[state.messages.length - 1];
    expect(helpMsg.text).toMatch(/Available commands/);
  });

  test('processInput with /clear wipes messages', async () => {
    const state = createAppState();
    expect(state.messages.length).toBeGreaterThan(0);
    await state.processInput('clear');
    expect(state.messages.length).toBe(0);
  });

  test('processInput with /exit returns shouldExit=true', async () => {
    const state = createAppState();
    const result = await state.processInput('exit');
    expect(result.shouldExit).toBe(true);
  });
});
