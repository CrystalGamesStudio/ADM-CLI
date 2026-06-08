/**
 * TDD — app-state: confirmation prompt handling
 *
 * Assumptions:
 * - When dispatch returns needsConfirm, processInput sets confirmStep state
 * - confirmStep exposes: { message, onConfirm, onCancel }
 * - After confirm callback runs, confirmStep resets to null
 * - After cancel, confirmStep resets to null
 * - NOT tested: React rendering, keyboard events
 */
const { createAppState } = require('../../../src/tui/app-state');

describe('app-state — confirmation prompt', () => {
  let appState;

  beforeEach(() => {
    appState = createAppState();
  });

  test('/uninstall sets confirmStep state', async () => {
    await appState.processInput('uninstall');
    expect(appState.confirmStep).not.toBeNull();
    expect(appState.confirmStep.message).toMatch(/remove/i);
  });

  test('confirmStep exposes onConfirm callback', async () => {
    await appState.processInput('uninstall');
    expect(typeof appState.confirmStep.onConfirm).toBe('function');
  });

  test('confirmStep exposes onCancel callback', async () => {
    await appState.processInput('uninstall');
    expect(typeof appState.confirmStep.onCancel).toBe('function');
  });

  test('confirmCancel resets confirmStep to null and adds message', async () => {
    await appState.processInput('uninstall');
    await appState.confirmCancel();
    expect(appState.confirmStep).toBeNull();
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/cancel/i);
  });

  test('confirmAction runs onConfirm, resets confirmStep, and returns result', async () => {
    jest.resetModules();
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({})),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    jest.doMock('../../../src/commands/uninstall', () => ({
      uninstall: jest.fn(() => Promise.resolve(true)),
    }));
    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();

    await appState.processInput('uninstall');
    const result = await appState.confirmAction();

    expect(appState.confirmStep).toBeNull();
    expect(result.shouldExit).toBe(true);
  });

  test('after cancel, normal input processing resumes', async () => {
    await appState.processInput('uninstall');
    await appState.confirmCancel();
    const result = await appState.processInput('help');
    expect(result.output).toMatch(/Available commands/);
  });
});
