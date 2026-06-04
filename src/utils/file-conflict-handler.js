const fs = require('fs');

/**
 * Detects file conflict — whether target file already exists
 * Returns 'no-conflict' or 'conflict'
 */
function handleConflict({ targetPath, sourcePath }) {
  if (!fs.existsSync(targetPath)) {
    return 'no-conflict';
  }

  // Check if it's a symlink — not a conflict if so
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) {
    return 'no-conflict';
  }

  return 'conflict';
}

/**
 * Creates a backup of a file (.backup) and returns the backup path
 */
function createBackup(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

module.exports = { handleConflict, createBackup };
