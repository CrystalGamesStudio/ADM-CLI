const appCommand = require('../../../../src/repl/commands/app-launch');

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('app command', () => {
  test('app launch starts configured app', async () => {
    const mockExeca = jest.fn().mockResolvedValue({});
    const config = { apps: { vscode: { command: 'code', args: ['.'] } } };
    const result = await appCommand.execute('launch vscode', { execa: mockExeca, config });
    expect(result.shouldExit).toBe(false);
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/launched/i);
    expect(mockExeca).toHaveBeenCalledWith('code', ['.']);
  });

  test('app launch shows error for unknown app', async () => {
    const mockExeca = jest.fn();
    const config = { apps: { vscode: { command: 'code' } } };
    const result = await appCommand.execute('launch vim', { execa: mockExeca, config });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/not configured/i);
    expect(mockExeca).not.toHaveBeenCalled();
  });

  test('app with no subcommand shows usage', async () => {
    const result = await appCommand.execute('', {});
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/usage/i);
  });

  test('app launch shows error when no apps configured', async () => {
    const result = await appCommand.execute('launch vscode', { config: {} });
    const plain = stripAnsi(result.output);
    expect(plain).toMatch(/not configured/i);
  });
});
