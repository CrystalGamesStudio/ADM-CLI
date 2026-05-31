const chalk = require('chalk');
const ora = require('ora');
const github = require('../integrations/github');

async function listPRs(options = {}) {
  const s = ora('Fetching pull requests...').start();
  try {
    const prs = await github.listPRs(options);
    s.stop();
    if (prs.length === 0) {
      console.log(chalk.yellow('  No open pull requests found.'));
      return [];
    }
    for (const pr of prs) {
      console.log(
        `  ${chalk.bold(`#${pr.number}`)} ${pr.title}`,
        chalk.gray(`(${pr.repo})`),
        chalk.green(pr.state),
      );
      console.log(chalk.gray(`    ${pr.url}`));
    }
    return prs;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

async function draftPR(title, options = {}) {
  const s = ora(`Creating draft PR "${title}"...`).start();
  try {
    const result = await github.createDraftPR(title, options);
    s.succeed(`Draft PR #${result.number} created`);
    console.log(chalk.gray(`  ${result.url}`));
    return result;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

async function commentPR(prNumber, message, options = {}) {
  const s = ora(`Commenting on PR #${prNumber}...`).start();
  try {
    const result = await github.commentOnPR(prNumber, message, options);
    s.succeed(`Comment added to PR #${prNumber}`);
    console.log(chalk.gray(`  ${result.url}`));
    return result;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

module.exports = { listPRs, draftPR, commentPR };
