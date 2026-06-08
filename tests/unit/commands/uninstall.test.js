/**
 * TDD — uninstall(): full removal (config + npm + binary)
 *
 * Assumptions:
 * - uninstall() removes ~/.adm config directory
 * - uninstall() runs `npm uninstall -g @crystalgames/adm` via child_process.spawn
 * - uninstall() attempts to remove /usr/local/bin/adm binary via fs.rm
 * - uninstall() cleans shell rc files (existing behavior)
 * - Errors in individual steps don't abort — best-effort removal
 * - Mock boundaries: fs.promises.rm, child_process.spawn
 * - NOT tested: actual npm execution, actual file deletion
 */
describe('uninstall() — full removal', () => {
  let mockRm;
  let mockSpawn;

  beforeEach(() => {
    jest.resetModules();
    mockRm = jest.fn(() => Promise.resolve());
    mockSpawn = jest.fn(() => ({
      on: jest.fn((event, cb) => { if (event === 'close') cb(0); }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
    }));

    jest.doMock('fs', () => ({
      promises: {
        rm: mockRm,
        readFile: jest.fn(() => Promise.resolve('')),
        writeFile: jest.fn(() => Promise.resolve()),
      },
    }));
    jest.doMock('child_process', () => ({ spawn: mockSpawn }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('removes ~/.adm config directory', async () => {
    const { uninstall } = require('../../../src/commands/uninstall');
    await uninstall();

    const calls = mockRm.mock.calls.map(c => c[0]);
    expect(calls).toContainEqual(expect.stringContaining('.adm'));
  });

  test('runs npm uninstall -g @crystalgames/adm', async () => {
    const { uninstall } = require('../../../src/commands/uninstall');
    await uninstall();

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '-g', '@crystalgames/adm'],
      expect.any(Object),
    );
  });

  test('attempts to remove /usr/local/bin/adm binary', async () => {
    const { uninstall } = require('../../../src/commands/uninstall');
    await uninstall();

    const calls = mockRm.mock.calls.map(c => c[0]);
    expect(calls).toContain('/usr/local/bin/adm');
  });

  test('returns true on success', async () => {
    const { uninstall } = require('../../../src/commands/uninstall');
    const result = await uninstall();
    expect(result).toBe(true);
  });

  test('returns true even if npm uninstall fails (best-effort)', async () => {
    mockSpawn.mockReturnValue({
      on: jest.fn((event, cb) => { if (event === 'close') cb(1); }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
    });

    const { uninstall } = require('../../../src/commands/uninstall');
    const result = await uninstall();
    expect(result).toBe(true);
  });

  test('returns true even if config dir removal fails (best-effort)', async () => {
    mockRm.mockRejectedValueOnce(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

    const { uninstall } = require('../../../src/commands/uninstall');
    const result = await uninstall();
    expect(result).toBe(true);
  });
});
