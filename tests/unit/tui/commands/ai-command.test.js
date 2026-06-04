/**
 * TDD — /ai command: registry dispatch
 *
 * Assumptions:
 * - Input: raw string without '/' prefix, passed to registry.dispatch()
 * - Output: { output?: string, shouldExit: boolean, shouldClear: boolean, shouldToggleAI?: boolean }
 * - Boundary: '/ai' with no args → toggle signal, '/ai <question>' → one-off query
 * - One-off query uses context.ai to call the GLM backend
 * - NOT tested: AI mode state management, rendering, knowledge system
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/ai command — registry dispatch', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('/ai with no args returns shouldToggleAI signal', async () => {
    const result = await registry.dispatch('ai');
    expect(result.shouldToggleAI).toBe(true);
    expect(result.shouldExit).toBe(false);
    expect(result.shouldClear).toBe(false);
  });

  test('/ai with question sends one-off query via context.ai', async () => {
    const mockAi = {
      query: jest.fn().mockResolvedValue('Use async/await for cleaner code.'),
    };
    const reg = createRegistry({ ai: mockAi });

    const result = await reg.dispatch('ai how to handle async?');
    expect(mockAi.query).toHaveBeenCalledWith('how to handle async?');
    expect(result.output).toMatch(/GLM:/);
    expect(result.output).toMatch(/async\/await/);
    expect(result.shouldToggleAI).toBeFalsy();
  });

  test('/ai with question but no context.ai shows error', async () => {
    const result = await registry.dispatch('ai what is git?');
    expect(result.output).toMatch(/AI not configured/);
    expect(result.shouldToggleAI).toBeFalsy();
  });
});
