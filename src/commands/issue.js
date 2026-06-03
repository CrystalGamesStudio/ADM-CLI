const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const gitlab = require('../integrations/gitlab');
const { listStoredServices } = require('../utils/keychain');

/**
 * Listuje issues z podłączonych platform (GitHub + GitLab)
 * Gdy wiele platform — interaktywny wybór
 * Gdy --platform podane — pomija wybór
 */
async function listIssues(options = {}) {
  const services = await listStoredServices();

  if (services.length === 0) {
    throw new Error('Brak podłączonych platform. Uruchom `adm connect github` lub `adm connect gitlab`.');
  }

  // Filtruj do platform wspierających issues
  const platforms = services.filter(s => ['github', 'gitlab'].includes(s));
  if (platforms.length === 0) {
    throw new Error('Brak podłączonych platform. Uruchom `adm connect github` lub `adm connect gitlab`.');
  }

  let platform = options.platform;

  // Gdy --platform podane, użyj go
  if (!platform) {
    if (platforms.length === 1) {
      platform = platforms[0];
    } else {
      // Interaktywny wybór
      const answer = await inquirer.prompt([{
        type: 'list',
        name: 'platform',
        message: 'Z której platformy pobrać issues?',
        choices: platforms.map(p => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: p })),
      }]);
      platform = answer.platform;
    }
  }

  const s = ora(`Pobieranie issues z ${platform}...`).start();
  try {
    let issues;
    if (platform === 'gitlab') {
      issues = await gitlab.listIssues(options);
    } else {
      // GitHub używa search API dla issues
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

    s.succeed(`Znaleziono ${issues.length} issues na platformie ${platform}`);
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
