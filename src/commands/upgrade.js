const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const { version: currentVersion } = require('../../package.json');

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
  const spinner = ora({ text: 'Checking for updates...', color: 'cyan' }).start();

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
      const installSpinner = ora({ text: `Updating to v${latestVersion}...`, color: 'cyan' }).start();
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
