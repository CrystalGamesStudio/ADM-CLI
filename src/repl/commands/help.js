const chalk = require('chalk');

function execute(args, { commands }) {
  const lines = [chalk.bold('Available commands:\n')];
  for (const [, cmd] of commands) {
    lines.push(`  ${chalk.green(cmd.name.padEnd(12))} ${cmd.description}`);
  }
  lines.push(`\nType ${chalk.bold('exit')} or press ${chalk.bold('Ctrl+C')} to quit.`);
  return { output: lines.join('\n'), shouldExit: false };
}

module.exports = { execute, description: 'Show command reference' };
