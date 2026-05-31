const child_process = require('child_process');

function isPnpmInstalled() {
  try {
    const v = child_process.execSync('pnpm -v', { encoding: 'utf8', stdio: 'pipe' }).trim();
    return { installed: true, version: v };
  } catch {
    return { installed: false, version: null };
  }
}

function isNpmInstalled() {
  try {
    const v = child_process.execSync('npm -v', { encoding: 'utf8', stdio: 'pipe' }).trim();
    return { installed: true, version: v };
  } catch {
    return { installed: false, version: null };
  }
}

async function installPnpm() {
  child_process.execSync('npm install -g pnpm', { encoding: 'utf8', stdio: 'pipe' });
  return isPnpmInstalled();
}

async function installNpm() {
  // npm comes with node; just verify
  return isNpmInstalled();
}

module.exports = { isPnpmInstalled, isNpmInstalled, installPnpm, installNpm };
