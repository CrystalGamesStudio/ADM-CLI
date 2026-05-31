const readline = require('readline');
const chalk = require('chalk');
const { createDispatcher, getCommandNames } = require('../repl/shell');
const { saveCommand, loadHistory } = require('../utils/command-history');
const { matchCommands } = require('../utils/fuzzy-search');
const ai = require('../integrations/ai-backend');

const DEFAULT_API_KEY = '34e301f7a5a04754bb7cbb0b0b7bdcc6.3TvbIZ2wlZwB5fTR';

async function start(context = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('adm> '),
    completer,
    historySize: 100,
    removeHistoryDuplicates: true,
  });

  const apiKey = context.apiKey || DEFAULT_API_KEY;
  const aiClient = ai.createClient({ apiKey });
  const aiContext = aiClient ? { query: ai.query, client: aiClient } : null;

  const dispatcher = createDispatcher({
    ai: aiContext,
    github: context.github || null,
    config: context.config || {},
  });

  try {
    const history = await loadHistory();
    if (history.length > 0) {
      rl.history = history.slice(-100).reverse();
    }
  } catch {
    // History loading is non-critical
  }

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

function completer(line) {
  const commands = getCommandNames();
  const hits = matchCommands(line.trim(), commands.map(name => ({ name })));
  const completions = hits.map(h => h.name);
  return [completions.length ? completions : commands, line];
}

module.exports = { start };
