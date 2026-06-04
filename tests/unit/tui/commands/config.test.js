/**
 * TDD — /config command
 *
 * Assumptions:
 * - Input: "config" (no args) → show current config as formatted JSON
 * - Output: { output: string (formatted JSON), shouldExit: false, shouldClear: false }
 * - Mocks: readConfig is mocked (system boundary — file I/O)
 * - Boundary: empty config, config with values
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

jest.mock('../../../../src/config', () => ({
  readConfig: jest.fn(),
}));

const { readConfig } = require('../../../../src/config');

describe('/config command', () => {
  let registry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = createRegistry({});
  });

  test('/config shows current configuration as formatted JSON', async () => {
    readConfig.mockResolvedValue({ theme: 'dark', aiProvider: 'glm-free' });
    const result = await registry.dispatch('config');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/theme/);
    expect(result.output).toMatch(/dark/);
    expect(result.output).toMatch(/aiProvider/);
    expect(result.output).toMatch(/glm-free/);
  });

  test('/config with empty config shows empty object', async () => {
    readConfig.mockResolvedValue({});
    const result = await registry.dispatch('config');
    expect(result.output).toMatch(/\{\}/);
  });
});
