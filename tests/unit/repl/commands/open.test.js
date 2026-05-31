const openCommand = require('../../../../src/repl/commands/open');

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('open command', () => {
  test('clones a repo by owner/name', async () => {
    const mockExeca = jest.fn().mockResolvedValue({ stdout: '' });
    const result = await openCommand.execute('owner/repo', { execa: mockExeca });
    expect(result.shouldExit).toBe(false);
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/cloned/i);
    expect(mockExeca).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', expect.stringContaining('owner/repo')]));
  });

  test('checks out existing branch', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('branch --list')) return 'my-branch\n';
      return '';
    };
    const mockExeca = jest.fn().mockResolvedValue({ stdout: '' });
    const result = await openCommand.execute('my-branch', { execSync: mockExec, execa: mockExeca });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/switched/i);
  });

  test('shows error for missing argument', async () => {
    const result = await openCommand.execute('', {});
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/usage/i);
  });
});
