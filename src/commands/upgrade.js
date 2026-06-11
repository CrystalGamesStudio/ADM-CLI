const { spawn } = require('child_process');
const chalk = require('chalk');
const { version: currentVersion } = require('../../package.json');

const FRAMES = ['◢', '◣', '◤', '◥'];

function createLoader(text) {
  let i = 0;
  let active = true;
  const interval = setInterval(() => {
    i = (i + 1) % FRAMES.length;
    process.stdout.write(`\r${chalk.cyan(FRAMES[i])} ${text}`);
  }, 80);

  return {
    update(t) { text = t; },
    succeed(msg) {
      active = false;
      clearInterval(interval);
      process.stdout.write(`\r${chalk.green('✔')} ${msg || text}\n`);
    },
    fail(msg) {
      active = false;
      clearInterval(interval);
      process.stdout.write(`\r${chalk.red('✖')} ${msg || text}\n`);
    },
    info(msg) {
      active = false;
      clearInterval(interval);
      process.stdout.write(`\r${chalk.yellow('ℹ')} ${msg || text}\n`);
    },
    stop() {
      if (!active) return;
      active = false;
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat((text || '').length + 4) + '\r');
    },
  };
}

function runSpawn(cmd, args) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(cmd, args, { stdio: 'pipe' });
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `Command failed with code ${code}`));
    });
  });
}

async function upgrade() {
  const spinner = createLoader('Checking for updates...');

  let latestVersion;
  try {
    const output = await runSpawn('npm', ['view', '@crystalgames/adm', 'version']);
    latestVersion = output.split('\n').pop().trim();
  } catch (err) {
    spinner.fail('Update check failed');
    return {
      output: chalk.red(`Unable to check for updates: ${err.message}`),
      shouldExit: false,
      shouldClear: false,
    };
  }

  if (latestVersion === currentVersion) {
    spinner.succeed(chalk.green(`Already up to date (v${currentVersion})`));
    return {
      output: '',
      shouldExit: false,
      shouldClear: false,
    };
  }

  spinner.info(chalk.yellow(`Update available: v${currentVersion} → v${latestVersion}`));

  return {
    output: `Update to v${latestVersion}? [y/N]`,
    needsConfirm: true,
    confirmMessage: `Update available: v${currentVersion} → v${latestVersion}`,
    async onConfirm() {
      const installSpinner = createLoader(`Updating to v${latestVersion}...`);
      try {
        await runSpawn('npm', ['install', '-g', '@crystalgames/adm@latest']);
        installSpinner.succeed(chalk.green(`Updated to v${latestVersion}`));
        return {
          output: chalk.green(`Restarting...`),
          shouldRestart: true,
          shouldExit: false,
          shouldClear: false,
        };
      } catch (err) {
        installSpinner.fail(chalk.red('Update failed'));
        return {
          output: chalk.red(`Update failed: ${err.message}`),
          shouldExit: false,
          shouldClear: false,
        };
      }
    },
    onCancel() {
      return { output: chalk.gray('Cancelled.'), shouldExit: false, shouldClear: false };
    },
    shouldExit: false,
    shouldClear: false,
  };
}

module.exports = { upgrade };
