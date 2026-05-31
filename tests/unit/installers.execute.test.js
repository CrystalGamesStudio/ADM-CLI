const child_process = require('child_process');
jest.spyOn(child_process, 'execSync');
const { runInstallers } = require('../../src/installers');

describe('Installers execution (mocked)', () => {
  beforeEach(() => {
    child_process.execSync.mockReset();
    child_process.execSync.mockReturnValue('ok');
  });

  test('executes planned commands when execute=true', async () => {
    const res = await runInstallers({ dryRun: false, execute: true, env: { ADM_PLATFORM_OVERRIDE: 'linux' } });
    expect(res.dryRun).toBe(false);
    expect(res.executed.length).toBeGreaterThan(0);
    for (const e of res.executed) {
      expect(e.status).toBe('executed');
      expect(e.stdout).toBe('ok');
    }
  });
});
