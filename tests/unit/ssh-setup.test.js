const fs = require('fs');
const path = require('path');
const os = require('os');
const { sshKeyExists, generateSshKey, getPublicKey } = require('../../src/installer/ssh-setup');

describe('SSH setup', () => {
  const testKeyDir = path.join(os.tmpdir(), 'adm-ssh-test-' + process.pid);
  const testKey = path.join(testKeyDir, 'id_ed25519');

  beforeEach(() => {
    fs.mkdirSync(testKeyDir, { recursive: true });
  });
  afterEach(() => {
    fs.rmSync(testKeyDir, { recursive: true, force: true });
  });

  test('sshKeyExists returns false when no key', () => {
    expect(sshKeyExists(testKey)).toBe(false);
  });

  test('generateSshKey creates a key', () => {
    const result = generateSshKey('test@adm', testKey);
    expect(result.skipped).toBe(false);
    expect(fs.existsSync(testKey)).toBe(true);
    expect(fs.existsSync(testKey + '.pub')).toBe(true);
  });

  test('sshKeyExists returns true after generation', () => {
    generateSshKey('test@adm', testKey);
    expect(sshKeyExists(testKey)).toBe(true);
  });

  test('generateSshKey skips when key exists', () => {
    generateSshKey('test@adm', testKey);
    const result = generateSshKey('test@adm', testKey);
    expect(result.skipped).toBe(true);
  });

  test('getPublicKey returns the public key string', () => {
    generateSshKey('test@adm', testKey);
    const pub = getPublicKey(testKey);
    expect(pub).toContain('ssh-ed25519');
    expect(pub).toContain('test@adm');
  });

  test('getPublicKey returns null when no key', () => {
    expect(getPublicKey('/nonexistent/key')).toBeNull();
  });
});
