const chalk = require('chalk');
const { listThemes, getTheme } = require('../../ui/theme');
const { readConfig, writeConfig } = require('../../config');
const { listProviders, getProvider } = require('../../integrations/ai-providers/registry');

const BUILTIN_COMMANDS = [
  { name: 'help', description: 'Show command reference' },
  { name: 'exit', description: 'Exit ADM' },
  { name: 'clear', description: 'Clear message history' },
  { name: 'theme', description: 'List or switch themes' },
  { name: 'config', description: 'Show current configuration' },
  { name: 'status', description: 'Show git status' },
  { name: 'ai', description: 'Toggle AI mode or ask a question' },
  { name: 'model', description: 'Show or switch AI provider' },
];

function createRegistry(context = {}) {
  const commands = new Map();
  for (const cmd of BUILTIN_COMMANDS) {
    commands.set(cmd.name, cmd);
  }

  async function dispatch(input) {
    const trimmed = input.trim();
    if (trimmed === '') {
      return { output: '', shouldExit: false, shouldClear: false };
    }

    const stripped = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    const parts = stripped.split(/\s+/);
    const cmdName = parts[0];
    const args = parts.slice(1).join(' ');

    const cmd = commands.get(cmdName);
    if (!cmd) {
      const suggestion = findClosestMatch(cmdName, commands);
      let msg = chalk.red(`Unknown command: /${cmdName}.`);
      if (suggestion) {
        msg += chalk.yellow(` Did you mean /${suggestion}?`);
      } else {
        msg += chalk.gray(' Type /help for available commands.');
      }
      return { output: msg, shouldExit: false, shouldClear: false };
    }

    // Built-in handlers
    if (cmdName === 'exit') {
      return { output: chalk.gray('Goodbye!'), shouldExit: true, shouldClear: false };
    }
    if (cmdName === 'clear') {
      return { output: chalk.green('Cleared.'), shouldExit: false, shouldClear: true };
    }
    if (cmdName === 'help') {
      return dispatchHelp(commands);
    }
    if (cmdName === 'theme') {
      return dispatchTheme(args, context);
    }
    if (cmdName === 'config') {
      return await dispatchConfig();
    }
    if (cmdName === 'status') {
      return dispatchStatus(context);
    }
    if (cmdName === 'ai') {
      return dispatchAi(args, context);
    }
    if (cmdName === 'model') {
      return await dispatchModel(args, context);
    }

    return { output: `/${cmdName} not yet implemented`, shouldExit: false, shouldClear: false };
  }

  function autocomplete(partial) {
    const p = partial.trim();
    if (p === '') return [...commands.keys()];
    return [...commands.keys()].filter(name => name.startsWith(p));
  }

  return { dispatch, autocomplete, commands };
}

function dispatchHelp(commands) {
  const lines = [chalk.bold('Available commands:\n')];
  for (const [, cmd] of commands) {
    lines.push(`  ${chalk.green(cmd.name.padEnd(12))} ${cmd.description}`);
  }
  lines.push(`\nType ${chalk.bold('/help')} for commands. ${chalk.bold('/exit')} to quit.`);
  return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
}

function dispatchTheme(args, context) {
  if (!args) {
    const themes = listThemes();
    const lines = [chalk.bold('Available themes:\n')];
    for (const t of themes) {
      const marker = context.theme && context.theme.current === t.name ? ' ← active' : '';
      lines.push(`  ${chalk.cyan(t.name)}${marker}`);
    }
    lines.push(`\nType ${chalk.bold('/theme <name>')} to switch.`);
    return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
  }

  try {
    getTheme(args); // throws if not found
    if (context.theme) context.theme.current = args;
    return {
      output: chalk.green(`Theme switched to ${chalk.bold(args)}.`),
      shouldExit: false,
      shouldClear: false,
    };
  } catch {
    return {
      output: chalk.red(`Unknown theme: ${args}. Type /theme to see available themes.`),
      shouldExit: false,
      shouldClear: false,
    };
  }
}

async function dispatchConfig() {
  const config = await readConfig();
  return {
    output: JSON.stringify(config, null, 2),
    shouldExit: false,
    shouldClear: false,
  };
}

function dispatchStatus(context) {
  const exec = context.execSync || require('child_process').execSync;
  try {
    const branch = exec('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const porcelain = exec('git status --porcelain', { encoding: 'utf8' }).trim();

    const lines = [`${chalk.bold('Branch:')} ${chalk.cyan(branch)}`];

    if (porcelain === '') {
      lines.push(chalk.green('  Working tree clean'));
    } else {
      const files = porcelain.split('\n').filter(Boolean);
      lines.push(chalk.bold(`  Modified (${files.length}):`));
      for (const f of files) {
        const status = f.substring(0, 2).trim();
        const path = f.substring(3);
        const color = status === '??' ? chalk.yellow : chalk.red;
        lines.push(`    ${color(status.padEnd(2))} ${path}`);
      }
    }

    return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
  } catch {
    return { output: chalk.yellow('Not in a git repo.'), shouldExit: false, shouldClear: false };
  }
}

module.exports = { createRegistry };

async function dispatchAi(args, context) {
  if (!args) {
    return { shouldToggleAI: true, shouldExit: false, shouldClear: false };
  }

  const ai = context.ai;
  if (!ai) {
    return { output: chalk.yellow('AI not configured. Set GLM_API_KEY or run `adm setup`.'), shouldExit: false, shouldClear: false };
  }

  try {
    const response = await ai.query(args);
    return { output: `GLM: ${response}`, shouldExit: false, shouldClear: false };
  } catch (err) {
    return { output: chalk.red(`AI error: ${err.message}`), shouldExit: false, shouldClear: false };
  }
}

async function dispatchModel(args, context) {
  const config = await readConfig();
  const currentProvider = config.aiProvider || 'glm-free';

  if (!args || args === 'list') {
    if (!args) {
      const current = getProvider(currentProvider);
      if (current) {
        const lines = [chalk.bold(`Current provider: ${chalk.cyan(current.name)} (${currentProvider})`), ''];
        const providers = listProviders();
        for (const p of providers) {
          const marker = p.id === currentProvider ? chalk.green(' ← active') : '';
          lines.push(`  ${chalk.cyan(p.id.padEnd(12))} ${p.name}${marker}`);
        }
        lines.push(`\nType ${chalk.bold('/model <id>')} to switch. ${chalk.bold('/model list')} for details.`);
        return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
      }
    }

    const providers = listProviders();
    const lines = [chalk.bold('Available AI providers:\n')];
    for (const p of providers) {
      const marker = p.id === currentProvider ? chalk.green(' ← active') : '';
      const auth = p.requiresAuth ? chalk.yellow('(requires API key)') : chalk.gray('(free/local)');
      lines.push(`  ${chalk.cyan(p.id.padEnd(12))} ${p.name.padEnd(18)} ${auth}${marker}`);
    }
    lines.push(`\nType ${chalk.bold('/model <id>')} to switch provider.`);
    return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
  }

  const provider = getProvider(args);
  if (!provider) {
    return {
      output: chalk.red(`Unknown provider: ${args}. Type /model list to see available providers.`),
      shouldExit: false,
      shouldClear: false,
    };
  }

  config.aiProvider = args;
  await writeConfig(config);

  const providerSpecific = [];
  if (args === 'openai') {
    providerSpecific.push(chalk.yellow('Set your API key: /config set ai.openaiKey <key>'));
  } else if (args === 'anthropic') {
    providerSpecific.push(chalk.yellow('Set your API key: /config set ai.anthropicKey <key>'));
  } else if (args === 'ollama') {
    providerSpecific.push(chalk.gray('Using default URL: http://localhost:11434'));
    providerSpecific.push(chalk.gray('Change with: /config set ai.ollamaUrl <url>'));
  }

  const lines = [chalk.green(`Provider switched to ${chalk.bold(provider.name)} (${args}).`)];
  if (providerSpecific.length) lines.push(...providerSpecific);

  return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findClosestMatch(input, commands, maxDist = 2) {
  let best = null, bestDist = Infinity;
  for (const [name] of commands) {
    const d = levenshtein(input, name);
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return bestDist <= maxDist ? best : null;
}
