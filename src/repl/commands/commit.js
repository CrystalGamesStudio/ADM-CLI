const chalk = require('chalk');
const { execSync } = require('child_process');

async function execute(args, context = {}) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand) {
    return { output: chalk.yellow('Usage: /commit <suggest>'), shouldExit: false };
  }

  if (subcommand === 'suggest') {
    const exec = context.execSync || execSync;
    let diff;
    try {
      diff = exec('git diff --cached', { encoding: 'utf8' }).trim();
    } catch {
      return { output: chalk.yellow('Not in a git repo.'), shouldExit: false };
    }

    if (!diff) {
      return { output: chalk.yellow('No staged changes. Use `git add` to stage files first.'), shouldExit: false };
    }

    const ai = context.ai;
    if (!ai) {
      return { output: chalk.yellow('AI not configured. Set GLM_API_KEY to use commit suggest.'), shouldExit: false };
    }

    try {
      const prompt = `Based on this git diff, suggest a concise commit message (just the subject line, under 72 chars, using conventional commits format):\n\n${diff}`;
      const message = await ai.query(prompt, { client: ai.client });
      return { output: `${chalk.bold('Suggested commit message:')}\n  ${message}`, shouldExit: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false };
    }
  }

  return { output: chalk.yellow(`Unknown commit subcommand: ${subcommand}. Use suggest.`), shouldExit: false };
}

module.exports = { execute, description: 'Commit subcommands: suggest' };
