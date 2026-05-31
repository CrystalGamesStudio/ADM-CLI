const child_process = require('child_process');
const os = require('os');

function detectPlatform() {
  return os.platform();
}

function isBrewInstalled() {
  try {
    child_process.execSync('brew --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function isAptInstalled() {
  try {
    child_process.execSync('dpkg -l apt', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function installBrew() {
  const cmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
  child_process.execSync(cmd, { shell: '/bin/bash', stdio: 'pipe' });
}

async function installAptPackages(packages = ['git', 'curl', 'build-essential']) {
  const pkg = packages.join(' ');
  child_process.execSync(`sudo apt-get update && sudo apt-get install -y ${pkg}`, {
    shell: '/bin/bash', stdio: 'pipe',
  });
}

async function installSystemPackage(pkg) {
  const platform = detectPlatform();
  const cmd = platform === 'darwin'
    ? `brew install ${pkg}`
    : `sudo apt-get install -y ${pkg}`;
  child_process.execSync(cmd, { shell: '/bin/bash', stdio: 'pipe' });
}

module.exports = {
  detectPlatform, isBrewInstalled, isAptInstalled,
  installBrew, installAptPackages, installSystemPackage,
};
