const chalk = require('chalk');
const ora = require('ora');
const gitlab = require('../integrations/gitlab');

/**
 * Lists merge requests from GitLab
 */
async function listMRs(options = {}) {
  const s = ora('Fetching merge requests...').start();
  try {
    const mrs = await gitlab.listMRs(options);
    s.succeed(`Found ${mrs.length} merge requests`);
    for (const mr of mrs) {
      console.log(`  ${chalk.bold(`!${mr.iid}`)} ${mr.title}`);
      console.log(`    ${chalk.gray(mr.url)}`);
    }
    return mrs;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

/**
 * Creates a draft MR on GitLab
 */
async function draftMR(title, options = {}) {
  const s = ora('Creating draft MR...').start();
  try {
    const mr = await gitlab.createDraftMR(title, options);
    s.succeed(`Draft MR created: ${chalk.green(mr.url)}`);
    return mr;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

/**
 * Comments on a GitLab MR
 */
async function commentMR(mrIid, message, options = {}) {
  const s = ora('Adding comment...').start();
  try {
    const result = await gitlab.commentOnMR(mrIid, message, options);
    s.succeed('Comment added');
    return result;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

module.exports = { listMRs, draftMR, commentMR };
