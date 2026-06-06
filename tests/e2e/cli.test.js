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

describe('adm --help', () => {
  test('exits with code 0', () => {
    const result = adm(['--help']);
    expect(result.status).toBe(0);
  });

  test('lists all major commands', () => {
    const result = adm(['--help']);
    const output = result.stdout;
    const commands = ['setup', 'installers', 'connect', 'pr', 'mr', 'issue-list', 'dotfiles', 'theme', 'uninstall', 'assistant'];
    for (const cmd of commands) {
      expect(output).toContain(cmd);
    }
  });

  test('shows version', () => {
    const result = adm(['--version']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('adm <command> --help', () => {
  test('setup --help shows setup-specific options', () => {
    const result = adm(['setup', '--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--dry-run');
  });

  test('connect --help lists subcommands', () => {
    const result = adm(['connect', '--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('github');
    expect(result.stdout).toContain('gitlab');
  });

  test('pr --help lists pr subcommands', () => {
    const result = adm(['pr', '--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('list');
    expect(result.stdout).toContain('draft');
  });
});

describe('unknown command', () => {
  test('exits with code 1 for unknown command', () => {
    const result = adm(['foobarbaz']);
    expect(result.status).toBe(1);
  });

  test('shows error message mentioning --help', () => {
    const result = adm(['foobarbaz']);
    expect(result.stderr).toContain('--help');
  });
});

describe('adm installers --execute', () => {
  test('exits with code 2 without ADM_EXECUTE=1', () => {
    const result = adm(['installers', '--execute']);
    expect(result.status).toBe(2);
  });

  test('shows refusal message', () => {
    const result = adm(['installers', '--execute']);
    expect(result.stderr).toContain('ADM_EXECUTE');
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
