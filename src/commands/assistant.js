const readline = require('readline');
const chalk = require('chalk');
const { createDispatcher } = require('../repl/shell');
const { saveCommand } = require('../utils/command-history');
const ai = require('../integrations/ai-backend');

async function start(context = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('adm> '),
  });

  const aiClient = ai.createClient({ apiKey: context.apiKey });
  const dispatcher = createDispatcher({
    ai: aiClient ? { query: ai.query, client: aiClient } : null,
    github: context.github || null,
    config: context.config || {},
  });

  console.log(chalk.bold('\nADM Assistant — type "help" for commands, "exit" to quit.\n'));
  rl.prompt();

  rl.on('line', async (line) => {
    const result = await dispatcher.dispatch(line);
    if (result.output) console.log(result.output);
    if (line.trim()) await saveCommand(line.trim());
    if (result.shouldExit) {
      rl.close();
      return;
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.gray('\nGoodbye!'));
    process.exit(0);
  });
}

module.exports = { start };
