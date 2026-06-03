const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const child_process = require('child_process');
const { readConfig, ensureConfigDir } = require('../config');
const { syncDotfiles } = require('../utils/dotfiles-sync');

/**
 * adm dotfiles sync — klonuje/pulluje repo dotfiles i synchronizuje pliki
 *
 * Opcje:
 *   repo: string — URL repo dotfiles (nadpisuje config)
 *   copy: boolean — kopiuj zamiast symlinkować
 *   only: string[] — filtr plików (np. ['bashrc', 'zshrc'])
 */
async function syncDotfilesCommand(options = {}) {
  const configDir = process.env.ADM_CONFIG_DIR || path.join(require('os').homedir(), '.adm');
  const dotfilesDir = path.join(configDir, 'dotfiles');

  // Pobierz URL repo
  let repoUrl = options.repo;
  if (!repoUrl) {
    const config = await readConfig();
    repoUrl = config?.dotfiles?.repo;
  }
  if (!repoUrl) {
    throw new Error('Brak URL repo dotfiles. Użyj --repo lub ustaw w configu (dotfiles.repo).');
  }

  // Klonuj lub pulluj repo
  const s = ora('Synchronizacja dotfiles...').start();
  try {
    if (fs.existsSync(path.join(dotfilesDir, '.git'))) {
      s.text = 'Pobieranie aktualizacji...';
      child_process.execSync(`git pull`, { cwd: dotfilesDir, stdio: 'pipe' });
    } else {
      // Usuń pusty katalog jeśli istnieje
      if (fs.existsSync(dotfilesDir)) {
        fs.rmSync(dotfilesDir, { recursive: true, force: true });
      }
      s.text = 'Klonowanie repo dotfiles...';
      child_process.execSync(`git clone ${repoUrl} ${dotfilesDir}`, { stdio: 'pipe' });
    }
    s.succeed('Repo dotfiles gotowe');
  } catch (err) {
    s.fail(`Błąd git: ${err.message}`);
    throw err;
  }

  // Synchronizuj pliki
  console.log(chalk.bold('\n  Synchronizacja plików:'));
  const result = await syncDotfiles({
    repo: repoUrl,
    copy: options.copy,
    only: options.only,
  });

  // Podsumowanie
  const total = result.symlinked.length + result.copied.length;
  console.log(chalk.bold(`\n  Zakończono: ${total} plików zsynchronizowanych`));
  if (result.skipped.length > 0) {
    console.log(chalk.yellow(`  Pominięto: ${result.skipped.join(', ')}`));
  }
  if (result.errors.length > 0) {
    console.log(chalk.red(`  Błędy: ${result.errors.map(e => e.file).join(', ')}`));
  }

  return result;
}

module.exports = { syncDotfilesCommand };
