const chalk = require('chalk');
const helpHandler = require('./commands/help');
const statusHandler = require('./commands/status');
const aiHandler = require('./commands/ai');
const prHandler = require('./commands/pr');
const commitHandler = require('./commands/commit');
const openHandler = require('./commands/open');
const appHandler = require('./commands/app-launch');

const BUILTIN_COMMANDS = [
  { name: 'help', description: 'Show command reference', handler: helpHandler },
  { name: 'exit', description: 'Exit the assistant', handler: () => ({ output: chalk.gray('Goodbye!'), shouldExit: true }) },
  { name: 'ai', description: 'Ask AI a question', handler: aiHandler },
  { name: 'status', description: 'Show git status and assigned issues', handler: statusHandler },
  { name: 'pr', description: 'PR subcommands: list, draft', handler: prHandler },
  { name: 'commit', description: 'Commit subcommands: suggest', handler: commitHandler },
  { name: 'open', description: 'Clone repo or checkout branch', handler: openHandler },
  { name: 'app', description: 'App subcommands: launch', handler: appHandler },
];

function createDispatcher(context = {}) {
  const commands = new Map();
  for (const cmd of BUILTIN_COMMANDS) {
    commands.set(cmd.name, cmd);
  }

  async function dispatch(input) {
    const trimmed = input.trim();
    if (trimmed === '') return { output: '', shouldExit: false };

    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0];
    const args = parts.slice(1).join(' ');

    const cmd = commands.get(cmdName);
    if (!cmd) {
      return { output: chalk.red(`Unknown command: ${cmdName}. Type ${chalk.bold('help')} for available commands.`), shouldExit: false };
    }

    const handler = typeof cmd.handler === 'function' ? cmd.handler : cmd.handler.execute;
    return handler(args, { ...context, commands });
  }

  return { dispatch, commands };
}

function getCommandNames() {
  return BUILTIN_COMMANDS.map(c => c.name);
}

module.exports = { createDispatcher, getCommandNames };
