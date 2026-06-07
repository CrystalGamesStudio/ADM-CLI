/**
 * TDD — /ai command: registry dispatch
 *
 * Assumptions:
 * - Input: raw string without '/' prefix, passed to registry.dispatch()
 * - Output: { output?: string, shouldExit: boolean, shouldClear: boolean, shouldToggleAI?: boolean }
 * - Boundary: '/ai' with no args → toggle signal, '/ai <question>' → query + toggle AI mode ON
 * - One-off query reads config for active provider + API key, uses queryWithProvider, also toggles AI mode
 * - NOT tested: AI mode state management, rendering, knowledge system
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

jest.mock('../../../../src/config', () => ({
  readConfig: jest.fn(() => Promise.resolve({})),
  writeConfig: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/integrations/ai-providers/registry', () => ({
  queryWithProvider: jest.fn(() => Promise.resolve('Use async/await for cleaner code.')),
}));

describe('/ai command — registry dispatch', () => {
  let registry;
  const { readConfig } = require('../../../../src/config');
  const { queryWithProvider } = require('../../../../src/integrations/ai-providers/registry');

  beforeEach(() => {
    jest.clearAllMocks();
    registry = createRegistry({});
  });

  test('/ai with no args returns shouldToggleAI signal', async () => {
    const result = await registry.dispatch('ai');
    expect(result.shouldToggleAI).toBe(true);
    expect(result.shouldExit).toBe(false);
    expect(result.shouldClear).toBe(false);
  });

  test('/ai with question sends one-off query via active provider', async () => {
    readConfig.mockResolvedValue({ aiProvider: 'glm-free', 'ai.glm-freeKey': 'test-key' });

    const result = await registry.dispatch('ai how to handle async?');

    expect(queryWithProvider).toHaveBeenCalledWith(
      'glm-free',
      'how to handle async?',
      expect.objectContaining({ apiKey: 'test-key' }),
    );
    expect(result.output).toMatch(/GLM:/);
    expect(result.output).toMatch(/async\/await/);
    expect(result.shouldToggleAI).toBe(true);
  });

  test('/ai with question but no API key shows error without toggling AI mode', async () => {
    readConfig.mockResolvedValue({});

    const result = await registry.dispatch('ai what is git?');
    expect(result.output).toMatch(/AI not configured/);
    expect(result.shouldToggleAI).toBeFalsy();
  });
});
