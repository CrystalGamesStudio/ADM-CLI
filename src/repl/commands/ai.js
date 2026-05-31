const chalk = require('chalk');
const ora = require('ora');

async function execute(args, context = {}) {
  if (!args || args.trim() === '') {
    return { output: chalk.yellow('Usage: ai <question>'), shouldExit: false };
  }

  const ai = context.ai;
  if (!ai) {
    return { output: chalk.yellow('AI not configured. Set GLM_API_KEY or run `adm setup`.'), shouldExit: false };
  }

  const spinner = ora('Thinking...').start();
  try {
    const response = await ai.query(args, { client: ai.client });
    spinner.stop();
    return { output: response, shouldExit: false };
  } catch (err) {
    spinner.stop();
    return { output: chalk.red(err.message), shouldExit: false };
  }
}

module.exports = { execute, description: 'Ask AI a question' };
