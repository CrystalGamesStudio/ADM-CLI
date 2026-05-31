const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  writeEncryptedToken, readEncryptedToken, deleteEncryptedToken, listTokenNames,
} = require('../../src/utils/token-encryption');

describe('Token encryption', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-tokens-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('write and read encrypted token', async () => {
    await writeEncryptedToken('github', 'ghp_abc123');
    const stored = await readEncryptedToken('github');
    expect(stored).toBe('ghp_abc123');
  });

  test('returns undefined for non-existent token', async () => {
    const stored = await readEncryptedToken('nonexistent');
    expect(stored).toBeUndefined();
  });

  test('delete removes token', async () => {
    await writeEncryptedToken('github', 'ghp_abc123');
    const deleted = await deleteEncryptedToken('github');
    expect(deleted).toBe(true);
    const stored = await readEncryptedToken('github');
    expect(stored).toBeUndefined();
  });

  test('delete returns false for non-existent token', async () => {
    const deleted = await deleteEncryptedToken('nonexistent');
    expect(deleted).toBe(false);
  });

  test('listTokenNames returns all stored names', async () => {
    await writeEncryptedToken('github', 'token1');
    await writeEncryptedToken('gitlab', 'token2');
    const names = await listTokenNames();
    expect(names).toContain('github');
    expect(names).toContain('gitlab');
  });

  test('token file is not plaintext JSON', async () => {
    await writeEncryptedToken('github', 'ghp_secret_token');
    const tokensPath = path.join(tmpDir, 'tokens.enc');
    const content = fs.readFileSync(tokensPath, 'utf8');
    expect(content).not.toContain('ghp_secret_token');
    expect(() => JSON.parse(content)).toThrow();
  });

  test('overwrite existing token', async () => {
    await writeEncryptedToken('github', 'old-token');
    await writeEncryptedToken('github', 'new-token');
    const stored = await readEncryptedToken('github');
    expect(stored).toBe('new-token');
  });
});
