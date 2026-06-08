const { spawn } = require('child_process');
const chalk = require('chalk');
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
  let latestVersion;
  try {
    const output = await runSpawn('npm', ['view', '@crystalgames/adm', 'version']);
    latestVersion = output.split('\n').pop().trim();
  } catch (err) {
    return {
      output: chalk.red(`Unable to check for updates: ${err.message}`),
      shouldExit: false,
      shouldClear: false,
    };
  }

  if (latestVersion === currentVersion) {
    return {
      output: chalk.green(`Already up to date (v${currentVersion})`),
      shouldExit: false,
      shouldClear: false,
    };
  }

  return {
    output: chalk.yellow(`Update available: v${currentVersion} → v${latestVersion}. Update? [y/N]`),
    needsConfirm: true,
    confirmMessage: `Update available: v${currentVersion} → v${latestVersion}`,
    async onConfirm() {
      try {
        await runSpawn('npm', ['install', '-g', '@crystalgames/adm@latest']);
        return {
          output: chalk.green(`Updated to v${latestVersion}. Restarting...`),
          shouldRestart: true,
          shouldExit: false,
          shouldClear: false,
        };
      } catch (err) {
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
