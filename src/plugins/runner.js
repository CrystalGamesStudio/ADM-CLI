const chalk = require('chalk');
const { loadPlugins } = require('./loader');
const { createPluginContext } = require('./context');

/**
 * Próbuje uruchomić wtyczkę o podanej nazwie.
 * Zwraca string (output wtyczki) lub null gdy wtyczka nie istnieje.
 * Błędy wykonania są obsługiwane gracefully — zwracany jest komunikat błędu.
 */
async function tryRunPlugin(commandName, args) {
  const plugins = loadPlugins();
  const plugin = plugins.get(commandName);

  if (!plugin) return null;

  try {
    const context = await createPluginContext();
    const output = await plugin.execute(args || '', context);
    return output;
  } catch (err) {
    return chalk.red(`  Błąd wtyczki "${commandName}": ${err.message}`);
  }
}

module.exports = { tryRunPlugin };
