const commitCommand = require('../../../../src/repl/commands/commit');

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('commit command', () => {
  test('commit suggest returns AI-generated message', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('diff --cached')) return 'diff --git a/foo.js b/foo.js\n+const x = 1;\n';
      return '';
    };
    const mockAi = {
      query: jest.fn().mockResolvedValue('feat: add x variable'),
    };
    const result = await commitCommand.execute('suggest', { execSync: mockExec, ai: mockAi });
    expect(result.shouldExit).toBe(false);
    expect(result.output).toContain('feat: add x variable');
  });

  test('commit suggest shows message when no staged changes', async () => {
    const mockExec = (cmd) => {
      if (cmd.includes('diff --cached')) return '';
      return '';
    };
    const result = await commitCommand.execute('suggest', { execSync: mockExec });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/no staged/i);
  });

  test('commit with no subcommand shows usage', async () => {
    const result = await commitCommand.execute('', {});
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/usage/i);
  });
});
