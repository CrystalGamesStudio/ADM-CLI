const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 16;
const TAG_LEN = 16;

function configDir() {
  return process.env.ADM_CONFIG_DIR || path.join(os.homedir(), '.adm');
}

function tokensFile() {
  return path.join(configDir(), 'tokens.enc');
}

function getMachineKey() {
  // Derive a stable key from machine-specific data
  const homedir = os.homedir();
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const secret = `adm-cli-${username}@${hostname}:${homedir}`;
  return crypto.scryptSync(secret, 'adm-cli-salt-v1', KEY_LEN);
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data, key) {
  const buf = Buffer.from(data, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

async function writeEncryptedToken(name, token) {
  const dir = configDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const key = getMachineKey();
  const store = readAllTokens(key);
  store[name] = token;

  const json = JSON.stringify(store, null, 2);
  const encrypted = encrypt(json, key);
  fs.writeFileSync(tokensFile(), encrypted, 'utf8');
  return true;
}

async function readEncryptedToken(name) {
  const key = getMachineKey();
  const store = readAllTokens(key);
  return store[name] || undefined;
}

async function deleteEncryptedToken(name) {
  const key = getMachineKey();
  const store = readAllTokens(key);
  if (!(name in store)) return false;
  delete store[name];
  const json = JSON.stringify(store, null, 2);
  const encrypted = encrypt(json, key);
  fs.writeFileSync(tokensFile(), encrypted, 'utf8');
  return true;
}

async function listTokenNames() {
  const key = getMachineKey();
  const store = readAllTokens(key);
  return Object.keys(store);
}

function readAllTokens(key) {
  if (!fs.existsSync(tokensFile())) return {};
  try {
    const data = fs.readFileSync(tokensFile(), 'utf8').trim();
    const json = decrypt(data, key);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

module.exports = {
  writeEncryptedToken, readEncryptedToken, deleteEncryptedToken, listTokenNames,
};
