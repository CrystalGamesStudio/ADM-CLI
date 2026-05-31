const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const github = require('../integrations/github');
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
  throw new Error(`Unknown service: ${service}. Supported: github`);
}

module.exports = { connectGithub, listConnections, disconnect };
