const fs = require('fs');
const os = require('os');
const path = require('path');
const { readConfig, writeConfig, configDir } = require('../../src/config/index');

describe('Config persistence', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-config-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('write and read config', async () => {
    const obj = { tested: true, value: 42 };
    await writeConfig(obj);
    const read = await readConfig();
    expect(read).toEqual(obj);
  });

  test('readConfig returns empty object when missing', async () => {
    const read = await readConfig();
    expect(read).toEqual({});
  });
});
