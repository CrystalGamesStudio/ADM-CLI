const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { handleConflict, createBackup } = require('./file-conflict-handler');

const DEFAULT_FILES = ['.bashrc', '.zshrc', '.gitconfig', '.ssh/config'];

/**
 * Synchronizuje dotfiles z repo do katalogu domowego
 *
 * Opcje:
 *   repo: string — ścieżka/URL repo dotfiles
 *   homeDir: string — katalog domowy (domyślnie os.homedir())
 *   copy: boolean — kopiuj zamiast symlinkować
 *   only: string[] — filtr plików (bez kropki, np. ['bashrc', 'zshrc'])
 *   files: string[] — lista plików (z kropką, np. ['.bashrc'])
 *   onConflict: () => 'skip' | 'backup' — strategia konfliktu
 */
async function syncDotfiles(options = {}) {
  const configDir = process.env.ADM_CONFIG_DIR || path.join(require('os').homedir(), '.adm');
  const dotfilesDir = path.join(configDir, 'dotfiles');
  const homeDir = options.homeDir || process.env.ADM_TEST_HOME || require('os').homedir();

  // Określ listę plików do synchronizacji
  let files = options.files || DEFAULT_FILES;

  // --only filtruje (użytkownik podaje bez kropki: 'bashrc' → '.bashrc')
  if (options.only && options.only.length > 0) {
    files = options.only.map(f => f.startsWith('.') ? f : '.' + f);
  }

  const result = { symlinked: [], copied: [], skipped: [], backedUp: [], errors: [] };

  for (const file of files) {
    const sourcePath = path.join(dotfilesDir, file);
    const targetPath = path.join(homeDir, file);

    // Sprawdź czy plik źródłowy istnieje w repo
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    // Twórz katalog docelowy jeśli potrzebny (np. .ssh/)
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Sprawdź konflikt
    const conflict = handleConflict({ targetPath, sourcePath });
    if (conflict === 'conflict') {
      const strategy = options.onConflict ? options.onConflict(file) : 'skip';
      if (strategy === 'skip') {
        result.skipped.push(file);
        console.log(chalk.yellow(`  ⚠ Pominięto ${file} (konflikt)`));
        continue;
      }
      if (strategy === 'backup') {
        createBackup(targetPath);
        result.backedUp.push(file);
        fs.unlinkSync(targetPath);
        console.log(chalk.blue(`  ℹ Backup ${file} → ${file}.backup`));
      }
    }

    // Symlink lub kopia
    try {
      if (options.copy) {
        fs.copyFileSync(sourcePath, targetPath);
        // Zachowaj uprawnienia
        const sourceStat = fs.statSync(sourcePath);
        fs.chmodSync(targetPath, sourceStat.mode);
        result.copied.push(file);
        console.log(chalk.green(`  ✔ Skopiowano ${file}`));
      } else {
        fs.symlinkSync(sourcePath, targetPath);
        result.symlinked.push(file);
        console.log(chalk.green(`  ✔ Symlink ${file}`));
      }
    } catch (err) {
      result.errors.push({ file, error: err.message });
      console.error(chalk.red(`  ✖ Błąd ${file}: ${err.message}`));
    }
  }

  return result;
}

module.exports = { syncDotfiles };
