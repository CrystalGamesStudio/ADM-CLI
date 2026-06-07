/**
 * TDD — /github unified command
 *
 * Assumptions:
 * - Input: "/github <subcommand>" or "/github" (no args)
 * - Output: { output: string, shouldExit: boolean, shouldClear: boolean }
 *   Plus: shouldStartGithub: boolean (when no args → interactive mode)
 * - Boundary: no args, unknown subcommand, old commands removed
 * - NOT tested: Ink rendering, GitHub API integration, AI provider specifics
 * - Delegates to existing dispatch functions for status/pr/issue/commit
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

jest.mock('../../../../src/integrations/github', () => ({
  listPRs: jest.fn().mockResolvedValue([
    { number: 42, title: 'Fix bug', repo: 'adm', state: 'open', url: 'https://github.com/a/adm/pull/42' },
  ]),
  createDraftPR: jest.fn().mockResolvedValue({ number: 43, url: 'https://github.com/a/adm/pull/43' }),
  commentOnPR: jest.fn().mockResolvedValue({ id: 1, url: 'https://github.com/a/adm/pull/42#comment' }),
  getClient: jest.fn().mockResolvedValue({
    users: { getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } }) },
    search: { issuesAndPullRequests: jest.fn().mockResolvedValue({ data: { items: [] } }) },
  }),
}));

jest.mock('../../../../src/utils/keychain', () => ({
  listStoredServices: jest.fn().mockResolvedValue(['github']),
}));

describe('/github command', () => {
  let registry;
  let mockExec;

  beforeEach(() => {
    mockExec = jest.fn();
    registry = createRegistry({ execSync: mockExec });
  });

  test('/github status delegates to dispatchStatus', async () => {
    mockExec.mockImplementation((cmd) => {
      if (cmd.includes('rev-parse')) return 'main\n';
      if (cmd.includes('porcelain')) return '';
    });

    const result = await registry.dispatch('github status');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/main/);
    expect(result.output).toMatch(/clean/i);
  });

  test('/github with no args triggers interactive mode', async () => {
    const result = await registry.dispatch('github');
    expect(result.shouldExit).toBe(false);
    expect(result.shouldClear).toBe(false);
    expect(result.shouldStartGithub).toBe(true);
    expect(result.output).toBeNull();
  });

  test('/github pr list delegates to dispatchPr', async () => {
    const result = await registry.dispatch('github pr list');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/#42/);
    expect(result.output).toMatch(/Fix bug/);
  });

  test('/github pr (no subcommand) defaults to listing PRs', async () => {
    const result = await registry.dispatch('github pr');
    expect(result.output).toMatch(/#42/);
  });

  test('/github issue list delegates to dispatchIssue', async () => {
    const result = await registry.dispatch('github issue list');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/No issues found/);
  });

  test('/github issue (no subcommand) defaults to listing issues', async () => {
    const result = await registry.dispatch('github issue');
    expect(result.output).toMatch(/No issues found/);
  });

  test('/github commit suggest delegates to dispatchCommit', async () => {
    mockExec.mockImplementation((cmd) => {
      if (cmd.includes('diff --cached')) return 'diff --git a/file\n+new line\n';
    });
    const mockAi = { query: jest.fn().mockResolvedValue('feat: add new feature') };
    const r = createRegistry({ execSync: mockExec, ai: mockAi });
    const result = await r.dispatch('github commit suggest');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/feat: add new feature/);
  });

  test('/github <unknown> returns usage message', async () => {
    const result = await registry.dispatch('github foobar');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/usage/i);
    expect(result.output).toMatch(/status|pr|issue|commit/);
  });
});

describe('old commands removed from registry', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('/status returns redirect to /github', async () => {
    const result = await registry.dispatch('status');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github status/);
  });

  test('/pr returns redirect to /github', async () => {
    const result = await registry.dispatch('pr');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github pr/);
  });

  test('/issue returns redirect to /github', async () => {
    const result = await registry.dispatch('issue');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github issue/);
  });

  test('/commit returns redirect to /github', async () => {
    const result = await registry.dispatch('commit');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github commit/);
  });

  test('/help shows /github but not status/pr/issue/commit', async () => {
    const result = await registry.dispatch('help');
    expect(result.output).toMatch(/github/);
    expect(result.output).not.toMatch(/status\s+Show git status/);
    expect(result.output).not.toMatch(/pr\s+Pull request/);
    expect(result.output).not.toMatch(/issue\s+List issues/);
    expect(result.output).not.toMatch(/commit\s+Commit subcommands/);
  });
});
