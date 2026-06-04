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
  { name: 'setup', description: 'Launch extension setup wizard' },
  { name: 'connect', description: 'Connect to GitHub or GitLab' },
  { name: 'pr', description: 'Pull request operations' },
  { name: 'mr', description: 'Merge request operations (GitLab)' },
  { name: 'issue', description: 'List issues from connected platform' },
  { name: 'commit', description: 'Commit subcommands: suggest' },
  { name: 'clock', description: 'Show ASCII clock' },
  { name: 'dotfiles', description: 'Sync dotfiles from repo' },
  { name: 'uninstall', description: 'Remove ADM CLI config' },
  { name: 'plugins', description: 'List loaded plugins' },
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
      // Try plugin fallback before reporting unknown command
      const pluginResult = await dispatchPlugin(cmdName, args, context);
      if (pluginResult) return pluginResult;

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
      return await dispatchTheme(args, context);
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
    if (cmdName === 'setup') {
      return dispatchSetup(args);
    }
    if (cmdName === 'connect') {
      return await dispatchConnect(args, context);
    }
    if (cmdName === 'pr') {
      return await dispatchPr(args, context);
    }
    if (cmdName === 'mr') {
      return await dispatchMr(args, context);
    }
    if (cmdName === 'issue') {
      return await dispatchIssue(args, context);
    }
    if (cmdName === 'commit') {
      return await dispatchCommit(args, context);
    }
    if (cmdName === 'clock') {
      return dispatchClock(args, context);
    }
    if (cmdName === 'dotfiles') {
      return await dispatchDotfiles(args, context);
    }
    if (cmdName === 'uninstall') {
      return await dispatchUninstall(context);
    }
    if (cmdName === 'plugins') {
      return dispatchPlugins(context);
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

async function dispatchTheme(args, context) {
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
    // Persist theme selection to config
    const config = await readConfig();
    config.theme = args;
    await writeConfig(config);
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
    return { output: chalk.yellow('AI not configured. Set GLM_API_KEY or run /setup.'), shouldExit: false, shouldClear: false };
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
  if (provider.requiresAuth) {
    providerSpecific.push(chalk.yellow(`Set your API key: /config set ai.${args}Key <key>`));
  }
  if (args === 'ollama') {
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

function dispatchSetup(args) {
  const isDryRun = args === '--dry-run';
  return {
    output: isDryRun ? chalk.cyan('Setup dry-run mode — showing planned actions') : null,
    shouldShowSetup: true,
    shouldExit: false,
    shouldClear: false,
    dryRun: isDryRun,
  };
}

// ─── /connect ──────────────────────────────────────────────
async function dispatchConnect(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand) {
    return {
      output: null,
      shouldExit: false,
      shouldClear: false,
      shouldStartConnect: true,
    };
  }

  if (subcommand === 'list') {
    const { listStoredServices: listFn } = require('../../utils/keychain');
    const services = await (context.listStoredServices || listFn)();
    if (services.length === 0) {
      return { output: chalk.yellow('No connected services.'), shouldExit: false, shouldClear: false };
    }
    const lines = services.map(s => `  ${chalk.green(s)}: connected`);
    return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
  }

  // Parse --token flag
  const tokenFlagIdx = parts.indexOf('--token');
  const token = tokenFlagIdx !== -1 && parts[tokenFlagIdx + 1] ? parts[tokenFlagIdx + 1] : null;

  if (subcommand === 'github') {
    if (!token) {
      return {
        output: chalk.yellow('Enter your GitHub PAT: /connect github --token <token>'),
        shouldExit: false,
        shouldClear: false,
        shouldPromptToken: 'github',
      };
    }
    try {
      const gh = require('../../integrations/github');
      const result = await gh.connect(token);
      return {
        output: chalk.green(`Connected to GitHub as ${chalk.bold(result.user.login)}`),
        shouldExit: false,
        shouldClear: false,
      };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'gitlab') {
    if (!token) {
      return {
        output: chalk.yellow('Enter your GitLab access token: /connect gitlab --token <token>'),
        shouldExit: false,
        shouldClear: false,
        shouldPromptToken: 'gitlab',
      };
    }
    try {
      const gl = require('../../integrations/gitlab');
      const result = await gl.connect(token);
      return {
        output: chalk.green(`Connected to GitLab as ${chalk.bold(result.user.username)}`),
        shouldExit: false,
        shouldClear: false,
      };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'disconnect') {
    const service = parts[1];
    if (!service) {
      return { output: chalk.yellow('Usage: /connect disconnect <github|gitlab>'), shouldExit: false, shouldClear: false };
    }
    try {
      if (service === 'github') {
        const gh = require('../../integrations/github');
        await gh.disconnect();
      } else if (service === 'gitlab') {
        const gl = require('../../integrations/gitlab');
        await gl.disconnect();
      }
      return { output: chalk.green(`${service} disconnected.`), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown connect subcommand: ${subcommand}. Type /connect list, /connect github, /connect gitlab, or /connect disconnect <service>`), shouldExit: false, shouldClear: false };
}

// ─── /pr ───────────────────────────────────────────────────
async function dispatchPr(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand) {
    return { output: chalk.yellow('Usage: /pr <list|draft|comment>'), shouldExit: false, shouldClear: false };
  }

  const gh = require('../../integrations/github');

  if (subcommand === 'list') {
    try {
      const prs = await gh.listPRs();
      if (prs.length === 0) {
        return { output: chalk.yellow('No open pull requests found.'), shouldExit: false, shouldClear: false };
      }
      const lines = prs.map(pr =>
        `  ${chalk.bold(`#${pr.number}`)} ${pr.title} ${chalk.gray(`(${pr.repo})`)} ${chalk.green(pr.state)}\n    ${chalk.gray(pr.url)}`
      );
      return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'draft') {
    const title = parts.slice(1).join(' ');
    if (!title) {
      return { output: chalk.yellow('Usage: /pr draft <title>'), shouldExit: false, shouldClear: false };
    }
    try {
      const result = await gh.createDraftPR(title);
      return {
        output: chalk.green(`Draft PR #${result.number} created\n  ${chalk.gray(result.url)}`),
        shouldExit: false,
        shouldClear: false,
      };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'comment') {
    const prNumber = parts[1];
    const message = parts.slice(2).join(' ');
    if (!prNumber || !message) {
      return { output: chalk.yellow('Usage: /pr comment <number> <message>'), shouldExit: false, shouldClear: false };
    }
    try {
      const result = await gh.commentOnPR(prNumber, message);
      return {
        output: chalk.green(`Comment added to PR #${prNumber}\n  ${chalk.gray(result.url)}`),
        shouldExit: false,
        shouldClear: false,
      };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown PR subcommand: ${subcommand}. Type /pr list, /pr draft <title>, or /pr comment <pr> <msg>`), shouldExit: false, shouldClear: false };
}

// ─── /mr ───────────────────────────────────────────────────
async function dispatchMr(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand) {
    return { output: chalk.yellow('Usage: /mr <list|draft|comment>'), shouldExit: false, shouldClear: false };
  }

  const gl = require('../../integrations/gitlab');

  if (subcommand === 'list') {
    try {
      const mrs = await gl.listMRs();
      if (mrs.length === 0) {
        return { output: chalk.yellow('No open merge requests found.'), shouldExit: false, shouldClear: false };
      }
      const lines = mrs.map(mr =>
        `  ${chalk.bold(`!${mr.iid}`)} ${mr.title}\n    ${chalk.gray(mr.url)}`
      );
      return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'draft') {
    const title = parts.slice(1).join(' ');
    if (!title) {
      return { output: chalk.yellow('Usage: /mr draft <title>'), shouldExit: false, shouldClear: false };
    }
    try {
      const result = await gl.createDraftMR(title);
      return {
        output: chalk.green(`Draft MR created: ${result.url}`),
        shouldExit: false,
        shouldClear: false,
      };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  if (subcommand === 'comment') {
    const mrIid = parts[1];
    const message = parts.slice(2).join(' ');
    if (!mrIid || !message) {
      return { output: chalk.yellow('Usage: /mr comment <iid> <message>'), shouldExit: false, shouldClear: false };
    }
    try {
      await gl.commentOnMR(mrIid, message);
      return { output: chalk.green(`Comment added to MR !${mrIid}`), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown MR subcommand: ${subcommand}. Type /mr list, /mr draft <title>, or /mr comment <mr> <msg>`), shouldExit: false, shouldClear: false };
}

// ─── /issue ────────────────────────────────────────────────
async function dispatchIssue(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand || subcommand === 'list') {
    try {
      const { listStoredServices: listFn } = require('../../utils/keychain');
      const services = await (context.listStoredServices || listFn)();
      const platforms = services.filter(s => ['github', 'gitlab'].includes(s));
      if (platforms.length === 0) {
        return { output: chalk.yellow('No connected platforms. Use /connect github or /connect gitlab.'), shouldExit: false, shouldClear: false };
      }

      const platform = platforms[0];

      if (platform === 'gitlab') {
        const gl = require('../../integrations/gitlab');
        const issues = await gl.listIssues();
        if (issues.length === 0) {
          return { output: chalk.yellow('No issues found.'), shouldExit: false, shouldClear: false };
        }
        const lines = issues.map(i => `  ${chalk.bold(`#${i.iid}`)} ${i.title}\n    ${chalk.gray(i.url)}`);
        return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
      }

      // GitHub
      const gh = require('../../integrations/github');
      const octokit = await gh.getClient();
      const { data: user } = await octokit.users.getAuthenticated();
      const { data } = await octokit.search.issuesAndPullRequests({
        q: `author:${user.login} is:issue is:open`,
        sort: 'updated',
        order: 'desc',
        per_page: 20,
      });
      const issues = data.items.map(issue => ({
        iid: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
      }));
      if (issues.length === 0) {
        return { output: chalk.yellow('No issues found.'), shouldExit: false, shouldClear: false };
      }
      const lines = issues.map(i => `  ${chalk.bold(`#${i.iid}`)} ${i.title}\n    ${chalk.gray(i.url)}`);
      return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown issue subcommand: ${subcommand}. Type /issue list`), shouldExit: false, shouldClear: false };
}

// ─── /commit ───────────────────────────────────────────────
async function dispatchCommit(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand) {
    return { output: chalk.yellow('Usage: /commit <suggest>'), shouldExit: false, shouldClear: false };
  }

  if (subcommand === 'suggest') {
    const exec = context.execSync || require('child_process').execSync;
    let diff;
    try {
      diff = exec('git diff --cached', { encoding: 'utf8' }).trim();
    } catch {
      return { output: chalk.yellow('Not in a git repo.'), shouldExit: false, shouldClear: false };
    }

    if (!diff) {
      return { output: chalk.yellow('No staged changes. Use `git add` to stage files first.'), shouldExit: false, shouldClear: false };
    }

    const ai = context.ai;
    if (!ai) {
      return { output: chalk.yellow('AI not configured. Set GLM_API_KEY to use commit suggest.'), shouldExit: false, shouldClear: false };
    }

    try {
      const prompt = `Based on this git diff, suggest a concise commit message (just the subject line, under 72 chars, using conventional commits format):\n\n${diff}`;
      const message = await ai.query(prompt);
      return { output: `${chalk.bold('Suggested commit message:')}\n  ${message}`, shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown commit subcommand: ${subcommand}. Type /commit suggest`), shouldExit: false, shouldClear: false };
}

// ─── /clock ────────────────────────────────────────────────
function dispatchClock(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (subcommand === 'theme') {
    return { shouldRunClockTheme: true, shouldExit: false, shouldClear: false };
  }

  return { shouldRunClock: true, shouldExit: false, shouldClear: false };
}

// ─── /dotfiles ─────────────────────────────────────────────
async function dispatchDotfiles(args, context) {
  const parts = (args || '').trim().split(/\s+/);
  const subcommand = parts[0];

  if (!subcommand || subcommand === 'sync') {
    try {
      const { syncDotfilesCommand } = require('../../commands/dotfiles');
      const result = await syncDotfilesCommand({ repo: parts[1] });
      const total = result.symlinked.length + result.copied.length;
      const lines = [chalk.green(`Synced ${total} files.`)];
      if (result.skipped.length > 0) {
        lines.push(chalk.yellow(`Skipped: ${result.skipped.join(', ')}`));
      }
      if (result.errors.length > 0) {
        lines.push(chalk.red(`Errors: ${result.errors.map(e => e.file).join(', ')}`));
      }
      return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
    } catch (err) {
      return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
    }
  }

  return { output: chalk.yellow(`Unknown dotfiles subcommand: ${subcommand}. Type /dotfiles sync`), shouldExit: false, shouldClear: false };
}

// ─── /uninstall ────────────────────────────────────────────
async function dispatchUninstall(context) {
  try {
    const { uninstall } = require('../../commands/uninstall');
    await uninstall();
    return { output: chalk.green('ADM CLI uninstalled. Remove the binary manually if needed.'), shouldExit: true, shouldClear: false };
  } catch (err) {
    return { output: chalk.red(err.message), shouldExit: false, shouldClear: false };
  }
}

// ─── /plugins ──────────────────────────────────────────────
function dispatchPlugins(context) {
  const { loadPlugins } = require('../../plugins/loader');
  const plugins = loadPlugins();

  if (plugins.size === 0) {
    return { output: chalk.yellow('No plugins installed. Add .js files to ~/.adm/plugins/'), shouldExit: false, shouldClear: false };
  }

  const lines = [chalk.bold('Loaded plugins:\n')];
  for (const [name, plugin] of plugins) {
    lines.push(`  ${chalk.green(name.padEnd(16))} ${plugin.description || '(no description)'}`);
  }
  return { output: lines.join('\n'), shouldExit: false, shouldClear: false };
}

// ─── Plugin fallback ───────────────────────────────────────
async function dispatchPlugin(cmdName, args, context) {
  try {
    const { loadPlugins } = require('../../plugins/loader');
    const plugins = loadPlugins();
    const plugin = plugins.get(cmdName);
    if (!plugin) return null;

    const output = await plugin.execute(args, context);
    return { output: typeof output === 'string' ? output : JSON.stringify(output), shouldExit: false, shouldClear: false };
  } catch {
    return null;
  }
}
