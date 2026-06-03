const fs = require('fs');

/**
 * Wykrywa konflikt pliku — czy plik docelowy już istnieje
 * Zwraca 'no-conflict' lub 'conflict'
 */
function handleConflict({ targetPath, sourcePath }) {
  if (!fs.existsSync(targetPath)) {
    return 'no-conflict';
  }

  // Sprawdź czy to symlink — jeśli tak, nie jest konfliktem
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) {
    return 'no-conflict';
  }

  return 'conflict';
}

/**
 * Tworzy backup pliku (.backup) i zwraca ścieżkę backupu
 */
function createBackup(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

module.exports = { handleConflict, createBackup };
