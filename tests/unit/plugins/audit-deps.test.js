// Założenia:
// - audit-deps to przykładowa wtyczka dostarczana z ADM
// - Plik: src/plugins/examples/audit-deps.js
// - Ładuje się jako moduł CommonJS z { name, description, execute }
// - execute(args, context) zwraca string z wynikiem audytu
// - Nie wymaga zewnętrznych zależności — używa context.logger do outputu
// - Analizuje package.json w cwd (jeśli istnieje) i raportuje zależności

const path = require('path');

const plugin = require('../../../src/plugins/examples/audit-deps');

describe('Plugin audit-deps', () => {
  test('eksportuje name, description, execute', () => {
    expect(plugin.name).toBe('audit-deps');
    expect(typeof plugin.description).toBe('string');
    expect(typeof plugin.execute).toBe('function');
  });

  test('execute zwraca string z wynikiem audytu', async () => {
    const ctx = {
      config: {},
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() },
      github: null,
      gitlab: null,
    };

    const result = await plugin.execute('', ctx);
    expect(typeof result).toBe('string');
  });

  test('execute wykrywa brak package.json i informuje użytkownika', async () => {
    const ctx = {
      config: {},
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() },
      github: null,
      gitlab: null,
    };

    // Uruchom w katalogu bez package.json (tmpdir)
    const originalCwd = process.cwd();
    const os = require('os');
    const fs = require('fs');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-audit-'));
    process.chdir(tmpDir);

    const result = await plugin.execute('', ctx);
    expect(result).toMatch(/package\.json/);

    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('execute analizuje package.json gdy istnieje', async () => {
    const fs = require('fs');
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-audit-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: { lodash: '^4.17.21' },
      devDependencies: { jest: '^29.0.0' },
    }));

    const ctx = {
      config: {},
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() },
      github: null,
      gitlab: null,
    };

    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    const result = await plugin.execute('', ctx);
    expect(result).toMatch(/lodash|zależności/i);

    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
