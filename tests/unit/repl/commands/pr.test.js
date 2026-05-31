const prCommand = require('../../../../src/repl/commands/pr');

describe('pr command', () => {
  test('pr list returns formatted PR list', async () => {
    const mockGithub = {
      listPRs: jest.fn().mockResolvedValue([
        { number: 42, title: 'Fix login bug', repo: 'org/repo', state: 'open', url: 'https://github.com/org/repo/pull/42' },
      ]),
    };
    const result = await prCommand.execute('list', { github: mockGithub });
    expect(result.shouldExit).toBe(false);
    expect(result.output).toContain('#42');
    expect(result.output).toContain('Fix login bug');
  });

  test('pr list shows message when no PRs', async () => {
    const mockGithub = {
      listPRs: jest.fn().mockResolvedValue([]),
    };
    const result = await prCommand.execute('list', { github: mockGithub });
    expect(result.output).toMatch(/no open/i);
  });

  test('pr draft creates draft PR', async () => {
    const mockGithub = {
      createDraftPR: jest.fn().mockResolvedValue({ number: 43, url: 'https://github.com/org/repo/pull/43' }),
    };
    const result = await prCommand.execute('draft Add new feature', { github: mockGithub });
    expect(result.output).toContain('#43');
    expect(mockGithub.createDraftPR).toHaveBeenCalledWith('Add new feature');
  });

  test('pr with no subcommand shows usage', async () => {
    const result = await prCommand.execute('', {});
    expect(result.output).toMatch(/usage/i);
  });

  test('pr shows error when github not connected', async () => {
    const result = await prCommand.execute('list', { github: null });
    expect(result.output).toMatch(/not connected/i);
  });
});
