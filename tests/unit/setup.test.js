const fs = require('fs');
const os = require('os');
const path = require('path');
const { runSetup } = require('../../src/setup/wizard');

describe('Setup wizard', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-setup-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('dry-run returns planned actions without writing config', async () => {
    const res = await runSetup({ dryRun: true });
    expect(res.dryRun).toBe(true);
    expect(res.planned).toBeDefined();
    expect(res.planned.length).toBeGreaterThan(0);
    const cfgFile = path.join(tmpDir, 'config.json');
    expect(fs.existsSync(cfgFile)).toBe(false);
  });

  test('dry-run includes key setup steps', async () => {
    const res = await runSetup({ dryRun: true });
    expect(res.planned).toContain('Install Node.js via nvm');
    expect(res.planned).toContain('Configure git (user.name, user.email, gpgsign)');
    expect(res.planned).toContain('Generate SSH key (ED25519)');
  });
});
