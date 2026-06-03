const readline = require('readline');
const chalk = require('chalk');
const { createDispatcher, getCommandNames } = require('../repl/shell');
const { saveCommand, loadHistory } = require('../utils/command-history');
const { matchCommands } = require('../utils/fuzzy-search');
const { resolveTheme } = require('../ui/theme');
const ai = require('../integrations/ai-backend');

const DEFAULT_API_KEY = '34e301f7a5a04754bb7cbb0b0b7bdcc6.3TvbIZ2wlZwB5fTR';

async function start(context = {}) {
  const config = context.config || {};
  const theme = resolveTheme(config);
  const c = theme.colors;

  const promptStr = chalk.hex(c.primary).bold('adm') + chalk.hex(c.muted)('> ');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptStr,
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

  // Register handlers FIRST so no input events are missed
  rl.on('line', async (line) => {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        rl.prompt();
        return;
      }

      const result = await dispatcher.dispatch(line);
      if (result.output) console.log(result.output);

      try {
        await saveCommand(trimmed);
      } catch {
        // History save is non-critical
      }

      if (result.shouldExit) {
        process.exit(0);
      }
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
    }

    // Guard: readline may have been closed by Ctrl+C during async operation
    if (!rl.closed) {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    // Only exit if readline closes and no async operation is keeping us alive.
    // In interactive mode this fires on Ctrl+D; in piped mode on stdin EOF.
    // The async line handler will keep the event loop alive until it finishes.
    if (!rl.closed) return;
    process.exit(0);
  });

  // Async setup — load history, print banner
  try {
    const history = await loadHistory();
    if (history.length > 0) {
      rl.history = history.slice(-100).reverse();
    }
  } catch {
    // History loading is non-critical
  }

  console.log(chalk.hex(c.primary).bold('\nADM Assistant') + chalk.hex(c.muted)(' — type "help" for commands, "exit" to quit.\n'));
  rl.prompt();
}

function completer(line) {
  const commands = getCommandNames();
  const hits = matchCommands(line.trim(), commands.map(name => ({ name })));
  const completions = hits.map(h => h.name);
  return [completions.length ? completions : commands, line];
}

module.exports = { start };
