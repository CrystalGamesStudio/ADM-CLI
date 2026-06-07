/**
 * TDD — TUI Registry extended commands (Issue #6)
 *
 * Tests verify that dispatch() returns { output, shouldExit, shouldClear }
 * for each new command migrated to TUI.
 *
 * Mocks only at system boundaries:
 * - GitHub/GitLab integrations (external APIs)
 * - Keychain (system credential store)
 * - child_process (shell commands)
 * - AI backend (external API)
 */
const chalk = require('chalk');

// ─── Mocks at system boundaries ─────────────────────────────
jest.mock('../../../../src/integrations/github', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  listPRs: jest.fn(),
  createDraftPR: jest.fn(),
  commentOnPR: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../../../../src/integrations/gitlab', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  listMRs: jest.fn(),
  createDraftMR: jest.fn(),
  commentOnMR: jest.fn(),
  listIssues: jest.fn(),
}));

jest.mock('../../../../src/utils/keychain', () => ({
  listStoredServices: jest.fn(),
  retrieveToken: jest.fn(),
  storeToken: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('../../../../src/commands/dotfiles', () => ({
  syncDotfilesCommand: jest.fn(),
}));

jest.mock('../../../../src/commands/uninstall', () => ({
  uninstall: jest.fn(),
}));

jest.mock('../../../../src/plugins/loader', () => ({
  loadPlugins: jest.fn(),
}));

const github = require('../../../../src/integrations/github');
const gitlab = require('../../../../src/integrations/gitlab');
const { listStoredServices } = require('../../../../src/utils/keychain');
const { syncDotfilesCommand } = require('../../../../src/commands/dotfiles');
const { uninstall } = require('../../../../src/commands/uninstall');
const { loadPlugins } = require('../../../../src/plugins/loader');
const { createRegistry } = require('../../../../src/tui/commands/registry');

// ─── /connect ──────────────────────────────────────────────
describe('/connect command in TUI', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/connect github <token> connects and returns success output', async () => {
    github.connect.mockResolvedValue({ user: { login: 'testuser' } });

    const result = await registry.dispatch('/connect github --token ghp_test123');

    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/github/i);
    expect(result.output).toMatch(/testuser/);
    expect(github.connect).toHaveBeenCalledWith('ghp_test123');
  });

  test('/connect github without token returns prompt message', async () => {
    const result = await registry.dispatch('/connect github');

    expect(result.output).toMatch(/token/i);
  });

  test('/connect gitlab <token> connects and returns success output', async () => {
    gitlab.connect.mockResolvedValue({ user: { username: 'gluser' } });

    const result = await registry.dispatch('/connect gitlab --token glpat_test');

    expect(result.output).toMatch(/gitlab/i);
    expect(result.output).toMatch(/gluser/);
    expect(gitlab.connect).toHaveBeenCalledWith('glpat_test');
  });

  test('/connect list shows stored connections', async () => {
    listStoredServices.mockResolvedValue(['github', 'gitlab']);

    const result = await registry.dispatch('/connect list');

    expect(result.output).toMatch(/github/);
    expect(result.output).toMatch(/gitlab/);
  });

  test('/connect github failure returns error message', async () => {
    github.connect.mockRejectedValue(new Error('Invalid token'));

    const result = await registry.dispatch('/connect github --token bad');

    expect(result.output).toMatch(/invalid token/i);
  });

  test('/connect without subcommand starts interactive connect', async () => {
    const result = await registry.dispatch('/connect');

    expect(result.shouldStartConnect).toBe(true);
  });
});

// ─── /pr (via /github) ─────────────────────────────────────
describe('/pr command redirects to /github', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/pr returns redirect to /github pr', async () => {
    const result = await registry.dispatch('/pr');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github pr/);
  });

  test('/github pr list shows formatted PRs', async () => {
    github.listPRs.mockResolvedValue([
      { number: 42, title: 'Fix login bug', repo: 'adm', state: 'open', url: 'https://github.com/x/adm/pull/42' },
      { number: 43, title: 'Add feature', repo: 'adm', state: 'open', url: 'https://github.com/x/adm/pull/43' },
    ]);

    const result = await registry.dispatch('/github pr list');

    expect(result.output).toMatch(/#42/);
    expect(result.output).toMatch(/Fix login bug/);
    expect(result.output).toMatch(/#43/);
    expect(result.output).toMatch(/Add feature/);
  });

  test('/github pr list with no PRs shows message', async () => {
    github.listPRs.mockResolvedValue([]);

    const result = await registry.dispatch('/github pr list');

    expect(result.output).toMatch(/no open pull requests/i);
  });

  test('/github pr draft <title> creates draft PR', async () => {
    github.createDraftPR.mockResolvedValue({ number: 99, url: 'https://github.com/x/adm/pull/99' });

    const result = await registry.dispatch('/github pr draft my new feature');

    expect(result.output).toMatch(/#99/);
    expect(github.createDraftPR).toHaveBeenCalledWith('my new feature');
  });

  test('/github pr draft without title shows usage', async () => {
    const result = await registry.dispatch('/github pr draft');

    expect(result.output).toMatch(/usage/i);
  });

  test('/github pr comment <id> <msg> comments on PR', async () => {
    github.commentOnPR.mockResolvedValue({ url: 'https://github.com/x/adm/pull/1#comment' });

    const result = await registry.dispatch('/github pr comment 42 looks good');

    expect(result.output).toMatch(/#42/);
    expect(github.commentOnPR).toHaveBeenCalledWith('42', 'looks good');
  });

  test('/github pr (no subcommand) defaults to listing PRs', async () => {
    github.listPRs.mockResolvedValue([
      { number: 7, title: 'Feature', repo: 'adm', state: 'open', url: 'https://github.com/x/adm/pull/7' },
    ]);

    const result = await registry.dispatch('/github pr');

    expect(result.output).toMatch(/#7/);
  });

  test('/github pr list failure returns error', async () => {
    github.listPRs.mockRejectedValue(new Error('API rate limit'));

    const result = await registry.dispatch('/github pr list');

    expect(result.output).toMatch(/API rate limit/);
  });
});

// ─── /mr ───────────────────────────────────────────────────
describe('/mr command in TUI', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/mr list shows formatted MRs', async () => {
    gitlab.listMRs.mockResolvedValue([
      { iid: 7, title: 'Fix pipeline', url: 'https://gitlab.com/x/adm/-/merge_requests/7' },
    ]);

    const result = await registry.dispatch('/mr list');

    expect(result.output).toMatch(/!7/);
    expect(result.output).toMatch(/Fix pipeline/);
  });

  test('/mr list with no MRs shows message', async () => {
    gitlab.listMRs.mockResolvedValue([]);

    const result = await registry.dispatch('/mr list');

    expect(result.output).toMatch(/no open merge requests/i);
  });

  test('/mr draft <title> creates draft MR', async () => {
    gitlab.createDraftMR.mockResolvedValue({ url: 'https://gitlab.com/x/adm/-/merge_requests/10' });

    const result = await registry.dispatch('/mr draft refactor auth');

    expect(result.output).toMatch(/Draft MR created/);
    expect(gitlab.createDraftMR).toHaveBeenCalledWith('refactor auth');
  });

  test('/mr comment <iid> <msg> comments on MR', async () => {
    gitlab.commentOnMR.mockResolvedValue({});

    const result = await registry.dispatch('/mr comment 5 nice work');

    expect(result.output).toMatch(/!5/);
    expect(gitlab.commentOnMR).toHaveBeenCalledWith('5', 'nice work');
  });

  test('/mr without subcommand shows usage', async () => {
    const result = await registry.dispatch('/mr');

    expect(result.output).toMatch(/usage/i);
  });
});

// ─── /issue (via /github) ──────────────────────────────────
describe('/issue command redirects to /github', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/issue returns redirect to /github issue', async () => {
    const result = await registry.dispatch('/issue');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github issue/);
  });

  test('/github issue list shows formatted issues from GitHub', async () => {
    listStoredServices.mockResolvedValue(['github']);
    github.getClient.mockResolvedValue({
      users: { getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'user' } }) },
      search: {
        issuesAndPullRequests: jest.fn().mockResolvedValue({
          data: { items: [
            { number: 10, title: 'Bug report', state: 'open', html_url: 'https://github.com/x/adm/issues/10' },
          ] },
        }),
      },
    });

    const result = await registry.dispatch('/github issue list');

    expect(result.output).toMatch(/#10/);
    expect(result.output).toMatch(/Bug report/);
  });

  test('/github issue list with no connected platforms shows message', async () => {
    listStoredServices.mockResolvedValue([]);

    const result = await registry.dispatch('/github issue list');

    expect(result.output).toMatch(/no connected platforms/i);
  });

  test('/github issue list with no issues shows message', async () => {
    listStoredServices.mockResolvedValue(['gitlab']);
    gitlab.listIssues.mockResolvedValue([]);

    const result = await registry.dispatch('/github issue list');

    expect(result.output).toMatch(/no issues found/i);
  });
});

// ─── /commit (via /github) ─────────────────────────────────
describe('/commit command redirects to /github', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/commit returns redirect to /github commit', async () => {
    const result = await registry.dispatch('/commit');
    expect(result.output).toMatch(/moved/);
    expect(result.output).toMatch(/\/github commit/);
  });

  test('/github commit suggest returns AI suggestion', async () => {
    const mockExec = jest.fn(() => 'diff --git a/file.js ...');
    const mockAi = { query: jest.fn().mockResolvedValue('feat: add new login flow') };
    registry = createRegistry({ execSync: mockExec, ai: mockAi });

    const result = await registry.dispatch('/github commit suggest');

    expect(result.output).toMatch(/suggested commit message/i);
    expect(result.output).toMatch(/feat: add new login flow/);
    expect(mockAi.query).toHaveBeenCalled();
  });

  test('/github commit suggest with no staged changes shows message', async () => {
    const mockExec = jest.fn(() => '');
    registry = createRegistry({ execSync: mockExec });

    const result = await registry.dispatch('/github commit suggest');

    expect(result.output).toMatch(/no staged changes/i);
  });

  test('/github commit without subcommand shows usage', async () => {
    const result = await registry.dispatch('/github commit');

    expect(result.output).toMatch(/usage/i);
  });
});

// ─── /dotfiles ─────────────────────────────────────────────
describe('/dotfiles command in TUI', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/dotfiles sync shows summary', async () => {
    syncDotfilesCommand.mockResolvedValue({
      symlinked: ['.bashrc', '.zshrc'],
      copied: [],
      skipped: [],
      errors: [],
    });

    const result = await registry.dispatch('/dotfiles sync');

    expect(result.output).toMatch(/synced 2 files/i);
  });

  test('/dotfiles sync with errors shows them', async () => {
    syncDotfilesCommand.mockResolvedValue({
      symlinked: ['.bashrc'],
      copied: [],
      skipped: ['config.ini'],
      errors: [{ file: 'broken', error: 'perm denied' }],
    });

    const result = await registry.dispatch('/dotfiles sync');

    expect(result.output).toMatch(/skipped/i);
    expect(result.output).toMatch(/errors/i);
  });

  test('/dotfiles sync failure shows error', async () => {
    syncDotfilesCommand.mockRejectedValue(new Error('No dotfiles repo'));

    const result = await registry.dispatch('/dotfiles sync');

    expect(result.output).toMatch(/no dotfiles repo/i);
  });
});

// ─── /uninstall ────────────────────────────────────────────
describe('/uninstall command in TUI', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/uninstall removes config and returns exit', async () => {
    uninstall.mockResolvedValue(true);

    const result = await registry.dispatch('/uninstall');

    expect(result.output).toMatch(/uninstalled/i);
    expect(result.shouldExit).toBe(true);
  });

  test('/uninstall failure shows error', async () => {
    uninstall.mockRejectedValue(new Error('Permission denied'));

    const result = await registry.dispatch('/uninstall');

    expect(result.output).toMatch(/permission denied/i);
  });
});

// ─── /<plugin-name> execution ──────────────────────────────
describe('plugin execution via TUI', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  test('/audit-deps executes plugin and shows output', async () => {
    const mockExecute = jest.fn().mockResolvedValue('Found 0 vulnerabilities');
    loadPlugins.mockReturnValue(new Map([
      ['audit-deps', { name: 'audit-deps', description: 'Audit deps', execute: mockExecute }],
    ]));

    const result = await registry.dispatch('/audit-deps --full');

    expect(result.output).toMatch(/found 0 vulnerabilities/i);
    expect(mockExecute).toHaveBeenCalledWith('--full', {});
  });

  test('unknown plugin falls through to unknown command', async () => {
    loadPlugins.mockReturnValue(new Map());

    const result = await registry.dispatch('/nonexistent-plugin');

    expect(result.output).toMatch(/unknown command/i);
  });
});

// ─── /help includes all commands ───────────────────────────
describe('/help shows all migrated commands', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
    jest.clearAllMocks();
  });

  const expectedCommands = [
    'connect', 'github', 'mr',
    'dotfiles', 'uninstall',
  ];

  test.each(expectedCommands)('/help output contains /%s', async () => {
    const result = await registry.dispatch('/help');

    expect(result.output).toMatch(new RegExp(`\\b${arguments[0]}\\b`));
  });

  test('/help output contains basic commands too', async () => {
    const result = await registry.dispatch('/help');

    expect(result.output).toMatch(/\bhelp\b/);
    expect(result.output).toMatch(/\bexit\b/);
    expect(result.output).toContain('ai');
    expect(result.output).toMatch(/\bsetup\b/);
  });
});
