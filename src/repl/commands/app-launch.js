const chalk = require('chalk');

async function execute(args, context = {}) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];
  const appName = parts[1];

  if (!subcommand) {
    return { output: chalk.yellow('Usage: /app <launch> <name>'), shouldExit: false };
  }

  if (subcommand !== 'launch') {
    return { output: chalk.yellow(`Unknown app subcommand: ${subcommand}. Type /app launch <name>.`), shouldExit: false };
  }

  if (!appName) {
    return { output: chalk.yellow('Usage: /app launch <name>'), shouldExit: false };
  }

  const config = context.config || {};
  const apps = config.apps || {};
  const app = apps[appName];

  if (!app) {
    const available = Object.keys(apps).join(', ') || 'none';
    return { output: chalk.yellow(`App "${appName}" not configured. Available: ${available}`), shouldExit: false };
  }

  const execaFn = context.execa || require('execa');
  try {
    await execaFn(app.command, app.args || []);
    return { output: `${chalk.green('Launched:')} ${appName}`, shouldExit: false };
  } catch (err) {
    return { output: chalk.red(`Failed to launch ${appName}: ${err.message}`), shouldExit: false };
  }
}

module.exports = { execute, description: 'App subcommands: launch' };
