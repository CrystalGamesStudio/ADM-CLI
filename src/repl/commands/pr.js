const chalk = require('chalk');

async function execute(args, context = {}) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];
  const rest = parts.slice(1).join(' ');

  if (!subcommand) {
    return { output: chalk.yellow('Usage: pr <list|draft> [args]'), shouldExit: false };
  }

  if (!context.github) {
    return { output: chalk.yellow('GitHub not connected. Run `adm connect github` first.'), shouldExit: false };
  }

  if (subcommand === 'list') {
    try {
      const prs = await context.github.listPRs();
      if (prs.length === 0) {
        return { output: chalk.gray('  No open pull requests found.'), shouldExit: false };
      }
      const lines = prs.map(pr =>
        `  ${chalk.bold(`#${pr.number}`)} ${pr.title} ${chalk.gray(`(${pr.repo})`)} ${chalk.green(pr.state)}\n  ${chalk.gray(pr.url)}`
      );
      return { output: lines.join('\n'), shouldExit: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false };
    }
  }

  if (subcommand === 'draft') {
    if (!rest) {
      return { output: chalk.yellow('Usage: pr draft <title>'), shouldExit: false };
    }
    try {
      const result = await context.github.createDraftPR(rest);
      return { output: `${chalk.green('Draft PR created:')} #${result.number}\n  ${chalk.gray(result.url)}`, shouldExit: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false };
    }
  }

  return { output: chalk.yellow(`Unknown pr subcommand: ${subcommand}. Use list or draft.`), shouldExit: false };
}

module.exports = { execute, description: 'PR subcommands: list, draft' };
