/**
 * TDD — /upgrade command
 *
 * Assumptions:
 * - upgrade() checks latest version via `npm view @crystalgames/adm version`
 * - Compares with current version from package.json
 * - When same: returns "Already up to date" message
 * - When newer: returns needsConfirm with version diff
 * - On confirm: runs `npm install -g @crystalgames/adm@latest`
 * - On confirm success: signals shouldRestart to spawn new process
 * - Mock boundaries: child_process.spawn (npm commands), package.json version
 * - NOT tested: actual npm execution, process spawning for restart
 */
describe('/upgrade command', () => {
  let mockSpawn;

  beforeEach(() => {
    jest.resetModules();
    mockSpawn = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockNpmView(latestVersion) {
    mockSpawn.mockImplementation((cmd, args) => {
      if (args[0] === 'view') {
        const handler = {
          on: jest.fn((event, cb) => {
            if (event === 'close') cb(0);
          }),
          stdout: {
            on: jest.fn((event, cb) => {
              if (event === 'data') cb(Buffer.from(latestVersion + '\n'));
            }),
          },
          stderr: { on: jest.fn() },
        };
        return handler;
      }
      return {
        on: jest.fn((event, cb) => { if (event === 'close') cb(0); }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
    });
  }

  test('already up to date — returns message with current version', async () => {
    mockNpmView('0.1.0'); // same as package.json
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();

    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/Already up to date/);
    expect(result.output).toMatch(/0\.1\.0/);
  });

  test('update available — returns needsConfirm with version info', async () => {
    mockNpmView('0.2.0');
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();

    expect(result.needsConfirm).toBe(true);
    expect(result.confirmMessage).toMatch(/0\.1\.0.*0\.2\.0|0\.2\.0.*0\.1\.0/);
  });

  test('update available — onConfirm runs npm install', async () => {
    mockNpmView('0.2.0');
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();

    await result.onConfirm();

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['install', '-g', '@crystalgames/adm@latest'],
      expect.any(Object),
    );
  });

  test('update available — onConfirm returns shouldRestart', async () => {
    mockNpmView('0.2.0');
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();
    const confirmResult = await result.onConfirm();

    expect(confirmResult.shouldRestart).toBe(true);
  });

  test('onCancel returns cancel message', async () => {
    mockNpmView('0.2.0');
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();
    const cancelResult = result.onCancel();

    expect(cancelResult.output).toMatch(/cancel/i);
  });

  test('npm view failure returns error message', async () => {
    mockSpawn.mockReturnValue({
      on: jest.fn((event, cb) => { if (event === 'close') cb(1); }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
    });
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
    jest.doMock('../../../package.json', () => ({ version: '0.1.0' }));

    const { upgrade } = require('../../../src/commands/upgrade');
    const result = await upgrade();

    expect(result.output).toMatch(/error|failed|unable/i);
    expect(result.needsConfirm).toBeFalsy();
  });
});
