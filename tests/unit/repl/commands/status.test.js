const statusHandler = require('../../../../src/repl/commands/status');

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('status command', () => {
  test('shows current branch name', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('rev-parse')) return 'main\n';
      return '';
    };
    const result = await statusHandler.execute('', { execSync: mockExec });
    expect(result.shouldExit).toBe(false);
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/Branch:\s+main/);
  });

  test('shows modified files', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('rev-parse')) return 'feature-branch\n';
      if (cmd.includes('status --porcelain')) return 'M  src/foo.js\n?? new-file.txt\n';
    };
    const result = await statusHandler.execute('', { execSync: mockExec });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/feature-branch/);
    expect(plain).toMatch(/src\/foo\.js/);
    expect(plain).toMatch(/new-file\.txt/);
  });

  test('shows clean working tree message when no changes', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('rev-parse')) return 'main\n';
      return '';
    };
    const result = await statusHandler.execute('', { execSync: mockExec });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/clean/i);
  });

  test('handles not in a git repo', async () => {
    const mockExec = () => { throw new Error('not a git repository'); };
    const result = await statusHandler.execute('', { execSync: mockExec });
    expect(result.shouldExit).toBe(false);
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/not in a git repo/i);
  });
});
