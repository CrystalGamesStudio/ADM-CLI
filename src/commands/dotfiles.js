const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const child_process = require('child_process');
const { readConfig, ensureConfigDir } = require('../config');
const { syncDotfiles } = require('../utils/dotfiles-sync');

/**
 * /dotfiles sync — clones/pulls dotfiles repo and synchronizes files
 *
 * Options:
 *   repo: string — dotfiles repo URL (overrides config)
 *   copy: boolean — copy instead of symlinking
 *   only: string[] — file filter (e.g. ['bashrc', 'zshrc'])
 */
async function syncDotfilesCommand(options = {}) {
  const configDir = process.env.ADM_CONFIG_DIR || path.join(require('os').homedir(), '.adm');
  const dotfilesDir = path.join(configDir, 'dotfiles');

  // Get repo URL
  let repoUrl = options.repo;
  if (!repoUrl) {
    const config = await readConfig();
    repoUrl = config?.dotfiles?.repo;
  }
  if (!repoUrl) {
    throw new Error('No dotfiles repo URL. Use --repo or set in config (dotfiles.repo).');
  }

  // Clone or pull repo
  const s = ora('Syncing dotfiles...').start();
  try {
    if (fs.existsSync(path.join(dotfilesDir, '.git'))) {
      s.text = 'Pulling updates...';
      child_process.execSync(`git pull`, { cwd: dotfilesDir, stdio: 'pipe' });
    } else {
      // Remove empty directory if it exists
      if (fs.existsSync(dotfilesDir)) {
        fs.rmSync(dotfilesDir, { recursive: true, force: true });
      }
      s.text = 'Cloning dotfiles repo...';
      child_process.execSync(`git clone ${repoUrl} ${dotfilesDir}`, { stdio: 'pipe' });
    }
    s.succeed('Dotfiles repo ready');
  } catch (err) {
    s.fail(`Git error: ${err.message}`);
    throw err;
  }

  // Sync files
  console.log(chalk.bold('\n  Syncing files:'));
  const result = await syncDotfiles({
    repo: repoUrl,
    copy: options.copy,
    only: options.only,
  });

  // Summary
  const total = result.symlinked.length + result.copied.length;
  console.log(chalk.bold(`\n  Done: ${total} files synced`));
  if (result.skipped.length > 0) {
    console.log(chalk.yellow(`  Skipped: ${result.skipped.join(', ')}`));
  }
  if (result.errors.length > 0) {
    console.log(chalk.red(`  Errors: ${result.errors.map(e => e.file).join(', ')}`));
  }

  return result;
}

module.exports = { syncDotfilesCommand };
