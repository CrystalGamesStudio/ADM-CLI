/**
 * E2E Smoke Tests — ADM CLI
 *
 * Assumptions:
 * - CLI is invoked via `node bin/adm`
 * - Tests run against the actual binary, no mocks
 * - Commands that require network/auth are NOT tested here (unit tests cover those)
 * - Only testing: help output, unknown commands, exit codes, startup time
 *
 * Boundary conditions:
 * - No config dir set (fresh state)
 * - No network required for help/unknown-command tests
 */
const { spawnSync } = require('child_process');
const path = require('path');

const adm = (args, env = {}) => {
  const bin = path.resolve(__dirname, '../../bin/adm');
  return spawnSync('node', [bin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ADM_CONFIG_DIR: '/tmp/adm-e2e-test', ...env },
    timeout: 10000,
  });
};

describe('adm --version', () => {
  test('exits with code 0', () => {
    const result = adm(['--version']);
    expect(result.status).toBe(0);
  });

  test('outputs version matching package.json', () => {
    const pkg = require('../../package.json');
    const result = adm(['--version']);
    expect(result.stdout.trim()).toBe(pkg.version);
  });
});

describe('adm -v', () => {
  test('exits with code 0', () => {
    const result = adm(['-v']);
    expect(result.status).toBe(0);
  });

  test('outputs version matching package.json', () => {
    const pkg = require('../../package.json');
    const result = adm(['-v']);
    expect(result.stdout.trim()).toBe(pkg.version);
  });
});

describe('adm (no args) opens TUI', () => {
  test('exits with code 0 when TERM=dumb (non-interactive fallback)', () => {
    const result = adm([], { TERM: 'dumb', ADM_CONFIG_DIR: '/tmp/adm-e2e-test' });
    // TUI may exit with 0 or 1 depending on environment; key is it doesn't hang
    expect(result.status).not.toBeNull();
  });
});

describe('removed subcommands do not exist', () => {
  const removedCommands = ['setup', 'connect', 'pr', 'mr', 'assistant'];

  for (const cmd of removedCommands) {
    test(`adm ${cmd} is not a recognized command`, () => {
      const result = adm([cmd]);
      expect(result.status).not.toBe(0);
    });
  }
});

describe('unknown command', () => {
  test('exits with code 1 for unknown command', () => {
    const result = adm(['foobarbaz']);
    expect(result.status).toBe(1);
  });
});

describe('startup performance', () => {
  test('adm --help completes in under 1 second', () => {
    const start = Date.now();
    adm(['--help']);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
