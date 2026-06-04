const chalk = require('chalk');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

async function execute(args, context = {}) {
  const target = (args || '').trim();
  if (!target) {
    return { output: chalk.yellow('Usage: /open <owner/repo | branch-name>'), shouldExit: false };
  }

  const exec = context.execSync || execSync;
  const execaFn = context.execa || require('execa');

  if (target.includes('/')) {
    const projectsDir = path.join(os.homedir(), 'projects');
    const repoName = target.split('/').pop();
    const dest = path.join(projectsDir, repoName);
    try {
      await execaFn('git', ['clone', `https://github.com/${target}.git`, dest]);
      return { output: `${chalk.green('Cloned:')} ${target} → ${dest}`, shouldExit: false };
    } catch (err) {
      return { output: chalk.red(`Failed to clone: ${err.message}`), shouldExit: false };
    }
  }

  try {
    const branches = exec('git branch --list ' + target, { encoding: 'utf8' }).trim();
    if (branches) {
      exec(`git checkout ${target}`, { encoding: 'utf8' });
      return { output: `${chalk.green('Switched to branch:')} ${target}`, shouldExit: false };
    }
    return { output: chalk.yellow(`Branch "${target}" not found locally.`), shouldExit: false };
  } catch {
    return { output: chalk.yellow('Not in a git repo.'), shouldExit: false };
  }
}

module.exports = { execute, description: 'Clone repo or checkout branch' };
