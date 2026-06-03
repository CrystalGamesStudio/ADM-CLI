const fs = require('fs');
const os = require('os');
const path = require('path');

// Założenia (Assumptions):
// - Katalog wtyczek: ~/.adm/plugins/ (respektuje ADM_CONFIG_DIR)
// - Pliki wtyczek to moduły CommonJS eksportujące { name, description, execute(args, context) }
// - Nazwa pliku minus .js = nazwa komendy (np. audit-deps.js → komenda audit-deps)
// - execute() jest asynchroniczna, zwraca string (output)
// - Katalog nieistniejący = brak wtyczek, bez błędu
// - Pliki inne niż .js są ignorowane

const { loadPlugins } = require('../../../src/plugins/loader');

describe('Plugin Loader', () => {
  let tmpDir;
  let pluginsDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-plugins-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
    pluginsDir = path.join(tmpDir, 'plugins');
  });

  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('zwraca pustą mapę, gdy katalog wtyczek nie istnieje', () => {
    const plugins = loadPlugins();
    expect(plugins).toBeInstanceOf(Map);
    expect(plugins.size).toBe(0);
  });

  test('zwraca pustą mapę, gdy katalog wtyczek jest pusty', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    const plugins = loadPlugins();
    expect(plugins.size).toBe(0);
  });

  test('ładuje prawidłową wtyczkę .js i rejestruje pod nazwą pliku', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    const pluginCode = `
      module.exports = {
        name: 'audit-deps',
        description: 'Audytuje zależności projektu',
        execute: async (args, context) => 'wynik audytu'
      };
    `;
    fs.writeFileSync(path.join(pluginsDir, 'audit-deps.js'), pluginCode);

    const plugins = loadPlugins();
    expect(plugins.size).toBe(1);
    expect(plugins.has('audit-deps')).toBe(true);

    const plugin = plugins.get('audit-deps');
    expect(plugin.name).toBe('audit-deps');
    expect(plugin.description).toBe('Audytuje zależności projektu');
    expect(typeof plugin.execute).toBe('function');
  });

  test('ignoruje pliki inne niż .js', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'readme.md'), '# Plugins');
    fs.writeFileSync(path.join(pluginsDir, 'config.json'), '{}');
    fs.writeFileSync(path.join(pluginsDir, '.hidden'), 'hidden');

    const plugins = loadPlugins();
    expect(plugins.size).toBe(0);
  });

  test('obsługuje gracefully wtyczkę z błędem składni', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'broken.js'), 'this is {{{ not valid JS');

    const plugins = loadPlugins();
    // Błędna wtyczka powinna być pominięta bez rzucania błędu
    expect(plugins.size).toBe(0);
  });

  test('obsługuje gracefully wtyczkę bez funkcji execute', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'no-exec.js'), 'module.exports = { name: "no-exec" };');

    const plugins = loadPlugins();
    // Wtyczka bez execute jest pomijana
    expect(plugins.size).toBe(0);
  });

  test('ładuje wiele wtyczek jednocześnie', () => {
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'foo.js'), `
      module.exports = { name: 'foo', description: 'Foo', execute: async () => 'foo' };
    `);
    fs.writeFileSync(path.join(pluginsDir, 'bar.js'), `
      module.exports = { name: 'bar', description: 'Bar', execute: async () => 'bar' };
    `);

    const plugins = loadPlugins();
    expect(plugins.size).toBe(2);
    expect(plugins.has('foo')).toBe(true);
    expect(plugins.has('bar')).toBe(true);
  });
});
