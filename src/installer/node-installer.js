const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const NVM_DIR = path.join(os.homedir(), '.nvm');

function isNodeInstalled() {
  try {
    child_process.execSync('command -v node >/dev/null 2>&1', { shell: '/bin/bash', stdio: 'pipe' });
    const version = child_process.execSync('node -v', { encoding: 'utf8' }).trim();
    return { installed: true, version };
  } catch {
    return { installed: false, version: null };
  }
}

function isNvmInstalled() {
  return fs.existsSync(path.join(NVM_DIR, 'nvm.sh'));
}

async function installNvm() {
  const cmd = 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash';
  child_process.execSync(cmd, { shell: '/bin/bash', stdio: 'pipe' });
  return true;
}

async function installNode(version = '--lts') {
  const nvmSource = isNvmInstalled()
    ? `source "${NVM_DIR}/nvm.sh"`
    : '';

  if (!isNvmInstalled()) {
    await installNvm();
  }

  const cmd = `${nvmSource || `source "${NVM_DIR}/nvm.sh"`} && nvm install ${version}`;
  const out = child_process.execSync(cmd, { shell: '/bin/bash', encoding: 'utf8', stdio: 'pipe' });
  return out.trim();
}

async function getNodeVersion() {
  try {
    return child_process.execSync('node -v', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

module.exports = { isNodeInstalled, isNvmInstalled, installNvm, installNode, getNodeVersion };
