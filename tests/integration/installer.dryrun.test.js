const { spawnSync } = require('child_process');
const path = require('path');

describe('Installer script (dry-run)', () => {
  test('prints DRY RUN when ADM_DRY_RUN=1 or --dry-run', () => {
    const installer = path.resolve(__dirname, '../../scripts/installer.sh');
    const res = spawnSync('bash', [installer, '--dry-run'], { env: { ...process.env, ADM_DRY_RUN: '1', ADM_INSTALL_PREFIX: process.cwd() }, encoding: 'utf8' });
    expect(res.stdout).toMatch(/DRY RUN/);
    expect(res.status).toBe(0);
  }, 20000);
});
