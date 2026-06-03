// Założenia (Assumptions):
// - bin/adm używa Commander.js — nie testujemy go bezpośrednio
// - Zamiast tego testujemy funkcję tryRunPlugin(commandName, args, context)
//   która szuka wtyczki i ją uruchamia
// - Gdy wtyczka istnieje — uruchamia execute(args, context) i zwraca wynik
// - Gdy wtyczka nie istnieje — zwraca null (sygnał do Commander, że nie znaleziono)
// - Błędy wykonania wtyczki są obsługiwane gracefully
// - Wbudowane komendy mają priorytet — plugin runner jest wywoływany dopiero po nieudanym matchu

const fs = require('fs');
const os = require('os');
const path = require('path');

// Mockujemy context — nie testujemy go tu ponownie
jest.mock('../../../src/plugins/context', () => ({
  createPluginContext: jest.fn().mockResolvedValue({
    config: { installed: true },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() },
    github: null,
    gitlab: null,
  }),
}));

const { tryRunPlugin } = require('../../../src/plugins/runner');

describe('Plugin CLI Integration', () => {
  let tmpDir;
  let pluginsDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-runner-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
    pluginsDir = path.join(tmpDir, 'plugins');
    fs.mkdirSync(pluginsDir, { recursive: true });
  });

  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('uruchamia pasującą wtyczkę i zwraca jej output', async () => {
    fs.writeFileSync(path.join(pluginsDir, 'hello.js'), `
      module.exports = {
        name: 'hello',
        description: 'Mówi cześć',
        execute: async (args, ctx) => 'Cześć ' + (args || 'świecie') + '!'
      };
    `);

    const result = await tryRunPlugin('hello', 'świecie');
    expect(result).toBe('Cześć świecie!');
  });

  test('zwraca null gdy wtyczka nie istnieje', async () => {
    const result = await tryRunPlugin('nieistnieje', '');
    expect(result).toBeNull();
  });

  test('obsługuje błąd wykonania wtyczki gracefully', async () => {
    fs.writeFileSync(path.join(pluginsDir, 'crash.js'), `
      module.exports = {
        name: 'crash',
        description: 'Zawsze rzuca błąd',
        execute: async () => { throw new Error('Boom!'); }
      };
    `);

    // Nie powinno rzucać błędu — zwraca komunikat o błędzie
    const result = await tryRunPlugin('crash', '');
    expect(result).toMatch(/Boom!/);
  });

  test('przekazuje puste args gdy brak argumentów', async () => {
    fs.writeFileSync(path.join(pluginsDir, 'echo.js'), `
      module.exports = {
        name: 'echo',
        description: 'Echo',
        execute: async (args) => args === '' ? 'puste' : args
      };
    `);

    const result = await tryRunPlugin('echo');
    expect(result).toBe('puste');
  });

  test('przekazuje kontekst do wtyczki', async () => {
    fs.writeFileSync(path.join(pluginsDir, 'check.js'), `
      module.exports = {
        name: 'check',
        description: 'Sprawdza kontekst',
        execute: async (args, ctx) => {
          return ctx.config.installed ? 'ok' : 'brak';
        }
      };
    `);

    const result = await tryRunPlugin('check', '');
    expect(result).toBe('ok');
  });
});
