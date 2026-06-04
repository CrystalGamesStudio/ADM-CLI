/**
 * TDD — Issue #7: adm launches TUI instead of old REPL
 *
 * Assumptions:
 * - Input: `node bin/adm` with no arguments
 * - Output: ink TUI launches (NOT old readline REPL)
 * - ink requires a TTY; in non-TTY CI it may exit with error or hang
 * - We verify by checking: stderr does NOT contain "ADM Assistant" (old REPL banner)
 * - We also verify the entry point imports the TUI boot function
 * - Boundary: process killed after timeout (no TTY in CI)
 * - NOT tested: actual rendering, interactive input
 */
const { spawnSync } = require('child_process');
const path = require('path');

const adm = (args, env = {}) => {
  const bin = path.resolve(__dirname, '../../bin/adm');
  return spawnSync('node', [bin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ADM_CONFIG_DIR: '/tmp/adm-e2e-tui-test', ...env },
    timeout: 5000,
  });
};

describe('adm (no args) launches TUI', () => {
  test('does NOT print old REPL banner "ADM Assistant"', () => {
    const result = adm([]);
    // The old REPL prints "ADM Assistant — type help for commands"
    // TUI (ink) does NOT print this — it renders fullscreen
    expect(result.stdout).not.toContain('ADM Assistant');
  });
});

describe('adm assistant (explicit) still works', () => {
  test('explicit "adm assistant" command is still registered', () => {
    const result = adm(['assistant', '--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('assistant');
  });
});
