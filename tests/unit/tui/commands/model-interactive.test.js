/**
 * TDD — Slice 4: Model Interactive — /model with inline API key input
 *
 * Assumptions:
 * - Input: dispatchModel(args, context) where args is provider ID string
 * - Config key pattern: ai.<providerId>Key (e.g., ai.groqKey, ai.openaiKey)
 * - Provider auth requirements from getProvider(id).requiresAuth
 * - When key needed: dispatch returns { shouldPromptModelToken: true, modelProvider: '<id>' }
 *   Provider is NOT activated yet (aiProvider not saved to config)
 * - When key already present or no auth: normal activation (no flag)
 * - app-state tracks: modelStep (null | 'token'), modelProvider (string)
 * - submitModelToken(token) saves key to config, saves aiProvider, clears state
 * - cancelModelToken() clears state, adds "Cancelled." message
 *
 * Boundary conditions:
 * - Empty config (no key) → prompt
 * - Config with key → skip prompt
 * - Provider with requiresAuth: false → skip prompt
 * - Esc during token input → cancel, return to normal mode
 *
 * NOT tested: ink rendering, useInput hooks, API key validation on entry
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

jest.mock('../../../../src/config', () => ({
  readConfig: jest.fn(() => Promise.resolve({})),
  writeConfig: jest.fn(() => Promise.resolve()),
}));

describe('/model interactive token flow — registry', () => {
  let registry;
  const { readConfig, writeConfig } = require('../../../../src/config');

  beforeEach(() => {
    jest.clearAllMocks();
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/model groq with no stored key returns shouldPromptModelToken', async () => {
    readConfig.mockResolvedValue({});
    const result = await registry.dispatch('model groq');

    expect(result.shouldPromptModelToken).toBe(true);
    expect(result.modelProvider).toBe('groq');
  });

  test('/model groq with existing key activates immediately without prompt', async () => {
    readConfig.mockResolvedValue({ aiProvider: 'glm', 'ai.groqKey': 'existing-key' });
    const result = await registry.dispatch('model groq');

    expect(result.shouldPromptModelToken).toBeUndefined();
    expect(result.output).toMatch(/Groq/i);
    expect(writeConfig).toHaveBeenCalledWith(expect.objectContaining({ aiProvider: 'groq' }));
  });

  test('/model glm with no stored key returns shouldPromptModelToken', async () => {
    readConfig.mockResolvedValue({});
    const result = await registry.dispatch('model glm');

    expect(result.shouldPromptModelToken).toBe(true);
    expect(result.modelProvider).toBe('glm');
  });
});
