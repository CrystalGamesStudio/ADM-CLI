const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SSH_DIR = path.join(os.homedir(), '.ssh');
const DEFAULT_KEY = path.join(SSH_DIR, 'id_ed25519');

function sshKeyExists(keyPath = DEFAULT_KEY) {
  return fs.existsSync(keyPath) || fs.existsSync(keyPath + '.pub');
}

function generateSshKey(email, keyPath = DEFAULT_KEY) {
  if (sshKeyExists(keyPath)) {
    return { skipped: true, reason: 'Key already exists' };
  }
  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { recursive: true, mode: 0o700 });
  }
  const cmd = `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`;
  child_process.execSync(cmd, { stdio: 'pipe' });
  return { skipped: false, keyPath };
}

function getPublicKey(keyPath = DEFAULT_KEY) {
  const pubPath = keyPath + '.pub';
  if (!fs.existsSync(pubPath)) return null;
  return fs.readFileSync(pubPath, 'utf8').trim();
}

module.exports = { sshKeyExists, generateSshKey, getPublicKey };
