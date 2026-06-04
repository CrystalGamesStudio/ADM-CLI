const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Plugin Loader — discovers and loads .js files from ~/.adm/plugins/
 *
 * Each plugin is a CommonJS module exporting:
 *   { name: string, description: string, execute(args, context): Promise<string> }
 *
 * File name minus .js = command name (e.g. audit-deps.js → command audit-deps)
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
        console.error(chalk.yellow(`  Plugin "${entry}" skipped — missing execute function.`));
        continue;
      }

      plugins.set(commandName, {
        name: plugin.name || commandName,
        description: plugin.description || '',
        execute: plugin.execute,
      });
    } catch (err) {
      console.error(chalk.yellow(`  Plugin "${entry}" skipped — load error: ${err.message}`));
    }
  }

  return plugins;
}

module.exports = { loadPlugins };
