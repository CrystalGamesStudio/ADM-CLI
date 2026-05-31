const { saveCommand, loadHistory, searchHistory } = require('../../../src/utils/command-history');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('command history', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-history-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('save and load commands', async () => {
    await saveCommand('help');
    await saveCommand('status');
    const history = await loadHistory();
    expect(history).toContain('help');
    expect(history).toContain('status');
  });

  test('history limited to 1000 entries', async () => {
    for (let i = 0; i < 1010; i++) {
      await saveCommand(`cmd-${i}`);
    }
    const history = await loadHistory();
    expect(history.length).toBeLessThanOrEqual(1000);
    expect(history[0]).toMatch(/cmd-\d+/);
  });

  test('search returns matching commands', async () => {
    await saveCommand('pr list');
    await saveCommand('pr draft my-feature');
    await saveCommand('status');
    const results = await searchHistory('pr');
    expect(results.length).toBe(2);
    expect(results[0]).toMatch(/pr/);
  });

  test('loadHistory returns empty array when file missing', async () => {
    const history = await loadHistory();
    expect(history).toEqual([]);
  });
});
