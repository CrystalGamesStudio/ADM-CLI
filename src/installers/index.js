const os = require('os');
const child_process = require('child_process');

function detectOS(env = process.env) {
  const platform = env.ADM_PLATFORM_OVERRIDE || os.platform();
  if (platform === 'darwin') return 'darwin';
  if (platform === 'linux') return 'linux';
  return 'unknown';
}

function planInstallers(platform) {
  platform = platform || detectOS();
  const actions = [];
  // Node (via nvm), pnpm/npm, git always recommended
  actions.push({ name: 'git', reason: 'required for repos' });
  actions.push({ name: 'node', method: 'nvm', reason: 'runtime for tools' });
  actions.push({ name: 'pnpm', method: 'pnpm', reason: 'fast package manager' });

  if (platform === 'darwin') {
    actions.unshift({ name: 'brew', reason: 'Homebrew package manager' });
  } else if (platform === 'linux') {
    actions.unshift({ name: 'apt', reason: 'APT package manager (Debian/Ubuntu)' });
  }

  return actions;
}

async function runInstallers(opts = {}) {
  const dry = opts.dryRun || process.env.ADM_DRY_RUN === '1';
  const plat = detectOS(opts.env);
  const planned = planInstallers(plat);
  if (dry) {
    return { dryRun: true, platform: plat, planned };
  }

  // By default do NOT perform network or sudo actions unless ADM_EXECUTE=1 is set.
  const execute = process.env.ADM_EXECUTE === '1' || opts.execute;
  const results = [];
  for (const a of planned) {
    const cmd = commandForAction(a, plat);
    if (!execute) {
      results.push({ name: a.name, command: cmd, status: 'skipped' });
      continue;
    }
    try {
      // run command synchronously; caller must ensure ADM_EXECUTE=1 intentionally
      const out = child_process.execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
      results.push({ name: a.name, command: cmd, status: 'executed', stdout: out });
    } catch (err) {
      results.push({ name: a.name, command: cmd, status: 'failed', error: err.message });
    }
  }
  return { dryRun: false, platform: plat, planned, executed: results };
}

function commandForAction(a, platform) {
  // Return a shell command that would perform the action (idempotent when possible)
  if (a.name === 'brew') return 'brew update && brew --version >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
  if (a.name === 'apt') return 'sudo apt-get update && sudo apt-get install -y git curl';
  if (a.name === 'git') return 'git --version || sudo apt-get install -y git || brew install git';
  if (a.name === 'node') return 'command -v node >/dev/null 2>&1 || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash';
  if (a.name === 'pnpm') return 'command -v pnpm >/dev/null 2>&1 || npm install -g pnpm';
  return '# unknown action';
}

module.exports = { detectOS, planInstallers, runInstallers };
