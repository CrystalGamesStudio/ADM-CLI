/**
 * TDD — Slice 4: app-state model token flow
 *
 * Assumptions:
 * - When registry returns shouldPromptModelToken, app-state enters modelStep='token'
 * - modelProvider tracks which provider is being configured
 * - submitModelToken(token) saves key to config, activates provider, clears state
 * - cancelModelToken() clears state, adds "Cancelled." message
 *
 * Boundary:
 * - Empty token → ignored (no save, no state change)
 *
 * NOT tested: ink rendering, keyboard events, API key validation
 */
const { createAppState } = require('../../../src/tui/app-state');

jest.mock('../../../src/config', () => ({
  readConfig: jest.fn(() => Promise.resolve({})),
  writeConfig: jest.fn((c) => Promise.resolve()),
}));

describe('app-state — model token flow', () => {
  let appState;
  const { readConfig, writeConfig } = require('../../../src/config');

  beforeEach(() => {
    jest.clearAllMocks();
    appState = createAppState();
  });

  test('modelStep starts as null', () => {
    expect(appState.modelStep).toBeNull();
  });

  test('/model groq with no key sets modelStep to token', async () => {
    readConfig.mockResolvedValue({});
    await appState.processInput('/model groq');

    expect(appState.modelStep).toBe('token');
    expect(appState.modelProvider).toBe('groq');
  });

  test('/model groq with existing key does NOT set modelStep', async () => {
    readConfig.mockResolvedValue({ 'ai.groqKey': 'existing-key' });
    await appState.processInput('/model groq');

    expect(appState.modelStep).toBeNull();
  });

  test('submitModelToken saves key to config and activates provider', async () => {
    readConfig.mockResolvedValue({ aiProvider: 'glm-free' });
    await appState.processInput('/model groq');

    readConfig.mockResolvedValue({ aiProvider: 'glm-free' });
    await appState.submitModelToken('my-secret-key');

    const savedConfig = writeConfig.mock.calls[writeConfig.mock.calls.length - 1][0];
    expect(savedConfig['ai.groqKey']).toBe('my-secret-key');
    expect(savedConfig.aiProvider).toBe('groq');
  });

  test('submitModelToken clears modelStep after saving', async () => {
    readConfig.mockResolvedValue({});
    await appState.processInput('/model groq');
    expect(appState.modelStep).toBe('token');

    readConfig.mockResolvedValue({});
    await appState.submitModelToken('my-key');
    expect(appState.modelStep).toBeNull();
  });

  test('submitModelToken adds confirmation message', async () => {
    readConfig.mockResolvedValue({});
    await appState.processInput('/model groq');

    readConfig.mockResolvedValue({});
    await appState.submitModelToken('my-key');

    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/Groq/i);
    expect(last.type).toBe('system');
  });

  test('cancelModelToken clears modelStep and adds cancelled message', async () => {
    readConfig.mockResolvedValue({});
    await appState.processInput('/model groq');
    expect(appState.modelStep).toBe('token');

    appState.cancelModelToken();

    expect(appState.modelStep).toBeNull();
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/cancelled/i);
  });
});
