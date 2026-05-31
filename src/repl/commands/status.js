const chalk = require('chalk');
const { execSync } = require('child_process');

function execute(args, context = {}) {
  const exec = context.execSync || execSync;
  try {
    const branch = exec('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const porcelain = exec('git status --porcelain', { encoding: 'utf8' }).trim();

    const lines = [`${chalk.bold('Branch:')} ${chalk.cyan(branch)}`];

    if (porcelain === '') {
      lines.push(chalk.green('  Working tree clean'));
    } else {
      const files = porcelain.split('\n').filter(Boolean);
      lines.push(chalk.bold(`  Modified (${files.length}):`));
      for (const f of files) {
        const status = f.substring(0, 2).trim();
        const path = f.substring(3);
        const color = status === '??' ? chalk.yellow : chalk.red;
        lines.push(`    ${color(status.padEnd(2))} ${path}`);
      }
    }

    return { output: lines.join('\n'), shouldExit: false };
  } catch {
    return { output: chalk.yellow('Not in a git repo.'), shouldExit: false };
  }
}

module.exports = { execute, description: 'Show git status and assigned issues' };
