const chalk = require('chalk');
const { loadPlugins } = require('./loader');
const { createPluginContext } = require('./context');

/**
 * Tries to run a plugin by name.
 * Returns string (plugin output) or null when plugin doesn't exist.
 * Execution errors are handled gracefully — returns error message.
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
    return chalk.red(`  Plugin error "${commandName}": ${err.message}`);
  }
}

module.exports = { tryRunPlugin };
