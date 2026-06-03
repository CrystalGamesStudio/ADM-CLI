const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Plugin Loader — odkrywa i ładuje pliki .js z katalogu ~/.adm/plugins/
 *
 * Każda wtyczka to moduł CommonJS eksportujący:
 *   { name: string, description: string, execute(args, context): Promise<string> }
 *
 * Nazwa pliku minus .js = nazwa komendy (np. audit-deps.js → komenda audit-deps)
 */
function loadPlugins() {
  const configDir = process.env.ADM_CONFIG_DIR || path.join(require('os').homedir(), '.adm');
  const pluginsDir = path.join(configDir, 'plugins');
  const plugins = new Map();

  if (!fs.existsSync(pluginsDir)) {
    return plugins;
  }

  const entries = fs.readdirSync(pluginsDir);
  for (const entry of entries) {
    if (!entry.endsWith('.js')) continue;

    const filePath = path.join(pluginsDir, entry);
    const commandName = path.basename(entry, '.js');

    try {
      const plugin = require(filePath);

      if (!plugin || typeof plugin.execute !== 'function') {
        console.error(chalk.yellow(`  Plugin "${entry}" pominięty — brak funkcji execute.`));
        continue;
      }

      plugins.set(commandName, {
        name: plugin.name || commandName,
        description: plugin.description || '',
        execute: plugin.execute,
      });
    } catch (err) {
      console.error(chalk.yellow(`  Plugin "${entry}" pominięty — błąd ładowania: ${err.message}`));
    }
  }

  return plugins;
}

module.exports = { loadPlugins };
