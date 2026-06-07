/**
 * TDD — /github status (was /status)
 *
 * Assumptions:
 * - Input: "github status" (no extra args) → show git branch + working tree status
 * - Output: { output: string, shouldExit: false, shouldClear: false }
 * - Mocks: execSync is mocked (system boundary — shell execution)
 * - Boundary: clean working tree, dirty working tree, not a git repo
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/github status', () => {
  let registry;
  let mockExec;

  beforeEach(() => {
    mockExec = jest.fn();
    registry = createRegistry({ execSync: mockExec });
  });

  test('shows branch and clean working tree', async () => {
    mockExec.mockImplementation((cmd) => {
      if (cmd.includes('rev-parse')) return 'main\n';
      if (cmd.includes('porcelain')) return '';
    });

    const result = await registry.dispatch('github status');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/main/);
    expect(result.output).toMatch(/clean/i);
  });

  test('shows modified files when dirty', async () => {
    mockExec.mockImplementation((cmd) => {
      if (cmd.includes('rev-parse')) return 'feature-branch\n';
      if (cmd.includes('porcelain')) return 'M  src/app.js\n?? new-file.txt\n';
    });

    const result = await registry.dispatch('github status');
    expect(result.output).toMatch(/feature-branch/);
    expect(result.output).toMatch(/app\.js/);
    expect(result.output).toMatch(/new-file\.txt/);
  });

  test('outside git repo shows friendly message', async () => {
    mockExec.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    const result = await registry.dispatch('github status');
    expect(result.output).toMatch(/not in a git repo/i);
  });
});
