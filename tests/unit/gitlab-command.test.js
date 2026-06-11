// Assumptions:
// - Input: partial command string typed by user (e.g. 'git')
// - Output: array of command names matching the prefix
// - Boundary: empty string returns all commands; no match returns empty array
// - NOT tested: chalk rendering, subcommand autocomplete

jest.mock('../../src/integrations/gitlab', () => ({
  listMRs: jest.fn(),
  createDraftMR: jest.fn(),
  commentOnMR: jest.fn(),
  listIssues: jest.fn(),
  getClient: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

const gitlab = require('../../src/integrations/gitlab');
const { createRegistry } = require('../../src/tui/commands/registry');

describe('/gitlab command', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
  });

  // Test 1: autocomplete shows 'gitlab' when typing '/git'
  test('autocomplete returns gitlab for prefix "git"', () => {
    const matches = registry.autocomplete('git');
    expect(matches).toContain('gitlab');
  });

  // Test 2: /gitlab without args shows usage
  test('/gitlab without args returns usage message', async () => {
    const result = await registry.dispatch('/gitlab');
    expect(result.output).toContain('Usage');
    expect(result.output).toContain('status');
    expect(result.output).toContain('mr');
    expect(result.output).toContain('issue');
    expect(result.output).toContain('commit');
  });

  // Test 3: /gitlab status delegates to dispatchStatus
  test('/gitlab status returns branch info', async () => {
    const fakeExec = () => 'main\n';
    const result = await registry.dispatch('/gitlab status', { execSync: fakeExec });
    expect(result.output).toContain('Branch');
    expect(result.output).toContain('main');
  });

  // Test 4: /gitlab mr list shows MRs
  test('/gitlab mr list returns merge requests', async () => {
    gitlab.listMRs.mockResolvedValue([
      { iid: 7, title: 'Fix login bug', url: 'https://gitlab.com/repo/-/merge_requests/7', state: 'opened' },
    ]);
    const result = await registry.dispatch('/gitlab mr list');
    expect(result.output).toContain('!7');
    expect(result.output).toContain('Fix login bug');
  });

  // Test 5: /gitlab mr list with no MRs
  test('/gitlab mr list shows message when no MRs', async () => {
    gitlab.listMRs.mockResolvedValue([]);
    const result = await registry.dispatch('/gitlab mr list');
    expect(result.output).toContain('No open merge requests');
  });

  // Test 6: /gitlab mr draft creates draft MR
  test('/gitlab mr draft creates a draft MR', async () => {
    gitlab.createDraftMR.mockResolvedValue({ iid: 8, url: 'https://gitlab.com/repo/-/merge_requests/8', draft: true });
    const result = await registry.dispatch('/gitlab mr draft New feature');
    expect(result.output).toContain('Draft MR');
    expect(result.output).toContain('8');
  });

  // Test 7: /gitlab mr comment adds comment
  test('/gitlab mr comment adds a comment', async () => {
    gitlab.commentOnMR.mockResolvedValue({ id: 100, body: 'LGTM' });
    const result = await registry.dispatch('/gitlab mr comment 7 LGTM');
    expect(result.output).toContain('Comment added');
    expect(result.output).toContain('!7');
  });

  // Test 8: /gitlab issue list shows GitLab issues
  test('/gitlab issue list returns issues from GitLab', async () => {
    gitlab.listIssues.mockResolvedValue([
      { iid: 23, title: 'GitLab TUI Command', url: 'https://gitlab.com/repo/-/issues/23' },
    ]);
    const result = await registry.dispatch('/gitlab issue list');
    expect(result.output).toContain('#23');
    expect(result.output).toContain('GitLab TUI Command');
  });

  // Test 9: /gitlab commit suggest returns AI suggestion
  test('/gitlab commit suggest returns commit message', async () => {
    const fakeExec = (cmd) => {
      if (cmd.includes('diff --cached')) return 'diff --git a/file.js\n+new line';
      return '';
    };
    const fakeAi = { query: jest.fn().mockResolvedValue('feat: add gitlab command') };
    const reg = createRegistry({ execSync: fakeExec, ai: fakeAi });
    const result = await reg.dispatch('/gitlab commit suggest');
    expect(result.output).toContain('Suggested commit message');
    expect(result.output).toContain('feat: add gitlab command');
  });

  // Test 10: no GitLab token gives clear setup message
  test('/gitlab mr list shows connect message when no token', async () => {
    gitlab.listMRs.mockRejectedValue(new Error('GitLab not connected. Run /connect gitlab first.'));
    const result = await registry.dispatch('/gitlab mr list');
    expect(result.output).toContain('GitLab not connected');
    expect(result.output).toContain('/connect gitlab');
  });

  // Test 11: API error shows readable message
  test('/gitlab mr list shows readable error on API failure', async () => {
    gitlab.listMRs.mockRejectedValue(new Error('Failed to fetch MRs: Network error'));
    const result = await registry.dispatch('/gitlab mr list');
    expect(result.output).toContain('Failed to fetch MRs');
  });

  // Test 12: unknown subcommand shows helpful message
  test('/gitlab with unknown subcommand shows usage', async () => {
    const result = await registry.dispatch('/gitlab repos');
    expect(result.output).toContain('Usage');
  });
});
