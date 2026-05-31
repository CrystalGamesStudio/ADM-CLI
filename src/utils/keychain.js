const child_process = require('child_process');
const os = require('os');
const tokenEncryption = require('./token-encryption');

const SERVICE = 'adm-cli';

function isKeychainAvailable() {
  if (os.platform() !== 'darwin') return false;
  try {
    child_process.execSync('security find-generic-password -s adm-cli 2>/dev/null', { stdio: 'pipe' });
    return true;
  } catch {
    // Keychain exists but no entry yet — still usable
    try {
      child_process.execSync('security list-keychains >/dev/null 2>&1', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

function keychainSet(name, value) {
  child_process.execSync(
    `security add-generic-password -U -s "${SERVICE}" -a "${name}" -w "${value}"`,
    { stdio: 'pipe' },
  );
}

function keychainGet(name) {
  try {
    return child_process.execSync(
      `security find-generic-password -s "${SERVICE}" -a "${name}" -w`,
      { encoding: 'utf8', stdio: 'pipe' },
    ).trim();
  } catch {
    return null;
  }
}

function keychainDelete(name) {
  try {
    child_process.execSync(
      `security delete-generic-password -s "${SERVICE}" -a "${name}"`,
      { stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}

async function storeToken(name, token) {
  if (isKeychainAvailable()) {
    keychainSet(name, token);
    return 'keychain';
  }
  await tokenEncryption.writeEncryptedToken(name, token);
  return 'encrypted-file';
}

async function retrieveToken(name) {
  if (isKeychainAvailable()) {
    const val = keychainGet(name);
    if (val) return val;
  }
  return tokenEncryption.readEncryptedToken(name);
}

async function removeToken(name) {
  if (isKeychainAvailable()) {
    return keychainDelete(name);
  }
  return tokenEncryption.deleteEncryptedToken(name);
}

async function listStoredServices() {
  // Always check both keychain and encrypted file
  const names = new Set();
  if (isKeychainAvailable()) {
    try {
      const out = child_process.execSync(
        `security dump-keychain 2>/dev/null | grep -A1 "svce.*${SERVICE}" | grep acct`,
        { encoding: 'utf8', stdio: 'pipe' },
      );
      const matches = out.matchAll(/"acct"<blob>="([^"]+)"/g);
      for (const m of matches) names.add(m[1]);
    } catch { /* empty */ }
  }
  const fileNames = await tokenEncryption.listTokenNames();
  fileNames.forEach(n => names.add(n));
  return [...names];
}

module.exports = {
  isKeychainAvailable, storeToken, retrieveToken, removeToken, listStoredServices,
};
