const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const gitlab = require('../integrations/gitlab');
const { listStoredServices } = require('../utils/keychain');

/**
 * Lists issues from connected platforms (GitHub + GitLab)
 * When multiple platforms — interactive selection
 * When --platform given — skips selection
 */
async function listIssues(options = {}) {
  const services = await listStoredServices();

  if (services.length === 0) {
    throw new Error('No connected platforms. Run /connect to connect GitHub or GitLab.');
  }

  // Filter to platforms supporting issues
  const platforms = services.filter(s => ['github', 'gitlab'].includes(s));
  if (platforms.length === 0) {
    throw new Error('No connected platforms. Run /connect to connect GitHub or GitLab.');
  }

  let platform = options.platform;

  // When --platform given, use it
  if (!platform) {
    if (platforms.length === 1) {
      platform = platforms[0];
    } else {
      // Interactive selection
      const answer = await inquirer.prompt([{
        type: 'list',
        name: 'platform',
        message: 'Which platform to fetch issues from?',
        choices: platforms.map(p => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: p })),
      }]);
      platform = answer.platform;
    }
  }

  const s = ora(`Fetching issues from ${platform}...`).start();
  try {
    let issues;
    if (platform === 'gitlab') {
      issues = await gitlab.listIssues(options);
    } else {
      // GitHub uses search API for issues
      const github = require('../integrations/github');
      const octokit = await github.getClient();
      const { data: user } = await octokit.users.getAuthenticated();
      const { data } = await octokit.search.issuesAndPullRequests({
        q: `author:${user.login} is:issue is:open`,
        sort: 'updated',
        order: 'desc',
        per_page: options.limit || 20,
      });
      issues = data.items.map(issue => ({
        iid: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        updatedAt: issue.updated_at,
      }));
    }

    s.succeed(`Found ${issues.length} issues on ${platform}`);
    for (const issue of issues) {
      console.log(`  ${chalk.bold(`#${issue.iid}`)} ${issue.title}`);
      console.log(`    ${chalk.gray(issue.url)}`);
    }
    return issues;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

module.exports = { listIssues };
