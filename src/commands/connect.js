const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const github = require('../integrations/github');
const gitlab = require('../integrations/gitlab');
const { listStoredServices, retrieveToken } = require('../utils/keychain');

async function connectGithub({ token } = {}) {
  if (!token) {
    ({ token } = await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: 'Enter GitHub Personal Access Token (PAT):',
      mask: '*',
    }]));
  }
  const s = ora('Validating GitHub token...').start();
  try {
    const result = await github.connect(token);
    s.succeed(`Connected to GitHub as ${chalk.green(result.user.login)}`);
    return { ok: true, user: result.user.login };
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

async function listConnections() {
  const services = await listStoredServices();
  if (services.length === 0) {
    console.log(chalk.yellow('  No connected services.'));
    return [];
  }
  for (const name of services) {
    const token = await retrieveToken(name);
    const masked = token ? token.substring(0, 4) + '****' + token.slice(-4) : '(none)';
    console.log(`  ${chalk.green(name)}: connected (token: ${masked})`);
  }
  return services;
}

async function disconnect(service) {
  if (service === 'github') {
    await github.disconnect();
    console.log(chalk.green('  GitHub disconnected.'));
    return true;
  }
  if (service === 'gitlab') {
    await gitlab.disconnect();
    console.log(chalk.green('  GitLab disconnected.'));
    return true;
  }
  throw new Error(`Unknown service: ${service}. Supported: github, gitlab`);
}

async function connectGitlab({ token } = {}) {
  if (!token) {
    ({ token } = await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: 'Enter GitLab Access Token:',
      mask: '*',
    }]));
  }
  const s = ora('Validating GitLab token...').start();
  try {
    const result = await gitlab.connect(token);
    s.succeed(`Connected to GitLab as ${chalk.green(result.user.username)}`);
    return { ok: true, user: result.user.username };
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

module.exports = { connectGithub, connectGitlab, listConnections, disconnect };
