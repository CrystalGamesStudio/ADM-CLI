const { createRegistry, getPlaceholderText } = require('./commands/registry');
const { resolveTheme } = require('../ui/theme');
const { readConfig, writeConfig } = require('../config');
const ai = require('../integrations/ai-backend');
const { getKnowledge } = require('../ai/knowledge');
const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION = `Crystal ADM-CLI ${require('../../package.json').version}`;
const WELCOME_TEXT = 'Welcome to ADM! Type /help for commands or /setup to install developer tools.';

function createAppState() {
  // Load saved config synchronously for correct initial state (no re-render needed)
  let savedTheme = 'dark';
  let savedProvider = 'glm';
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.adm', 'config.json'), 'utf8'));
    if (cfg.theme) savedTheme = cfg.theme;
    if (cfg.aiProvider) savedProvider = cfg.aiProvider;
  } catch {}

  const config = {};
  const themeState = { current: savedTheme };
  const theme = resolveTheme(config);
  const registry = createRegistry({ theme: themeState, execSync: null });

  const state = {
    messages: [{ text: WELCOME_TEXT, type: 'system' }],
    theme,
    themeState,
    config,
    aiMode: false,
    showSetup: false,
    setupDryRun: false,
    connectStep: null,
    connectPlatform: null,
    connectCursor: 0,
    modelStep: null,
    modelProvider: null,
    aiLoading: false,
    githubStep: null,
    githubCursor: 0,
    confirmStep: null,
    upgradeLoading: false,
    aiHistory: [],
    activeProvider: savedProvider,
  };

  let knowledge = null;
  try {
    knowledge = getKnowledge(VERSION, process.cwd());
  } catch {
    // knowledge unavailable — continue without it
  }

  function disableAI() {
    state.aiMode = false;
    state.aiHistory = [];
    state.messages.push({ text: 'AI: off', type: 'system' });
  }

  async function processInput(input) {
    const trimmed = input.trim();

    // In AI mode, intercept /exit and /ai to leave/toggle AI mode
    const cmd = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    if (state.aiMode && (cmd === 'exit' || cmd === 'ai')) {
      state.aiMode = false;
      state.aiHistory = [];
      state.messages.push({ text: 'Exited AI mode.', type: 'system' });
      return { output: null, shouldExit: false, shouldClear: false };
    }

    // In AI mode, send non-command input to the active AI provider
    if (state.aiMode) {
      state.aiLoading = true;
      try {
        const messages = [];
        if (knowledge) {
          messages.push({ role: 'system', content: knowledge });
        }
        messages.push(...state.aiHistory);
        messages.push({ role: 'user', content: input });

        const cfg = await readConfig();
        const providerId = cfg.aiProvider || 'glm';
        state.activeProvider = providerId;
        const apiKey = cfg[`ai.${providerId}Key`] || process.env.GLM_API_KEY;

        if (!apiKey && providerId !== 'ollama') {
          throw new Error(`AI not configured. No API key for ${providerId}. Use /model ${providerId} to set one.`);
        }

        const { queryWithProvider } = require('../integrations/ai-providers/registry');
        const response = await queryWithProvider(providerId, input, { apiKey, messages });

        state.aiHistory.push({ role: 'user', content: input });
        state.aiHistory.push({ role: 'assistant', content: response });

        const prefix = providerId === 'glm' ? 'GLM' : providerId;
        state.messages.push({ text: `${prefix}: ${response}`, type: 'ai' });
      } catch (err) {
        state.messages.push({ text: `AI error: ${err.message}`, type: 'ai-error' });
      } finally {
        state.aiLoading = false;
      }
      return { output: null, shouldExit: false, shouldClear: false };
    }

    // Set upgrade loading before async dispatch
    const cmdName = trimmed.startsWith('/') ? trimmed.slice(1).split(/\s+/)[0] : trimmed.split(/\s+/)[0];
    if (cmdName === 'upgrade') {
      state.upgradeLoading = true;
    }

    const result = await registry.dispatch(input);
    state.upgradeLoading = false;

    if (result.shouldClear) {
      state.messages.length = 0; // mutate in-place so external refs stay valid
      return result;
    }

    if (result.shouldToggleAI) {
      state.aiMode = !state.aiMode;
      const label = state.aiMode
        ? `AI: ON (${state.activeProvider}) — type a question, /exit to leave AI mode`
        : 'AI: off';
      state.messages.push({ text: label, type: 'system' });
      if (result.output) {
        state.messages.push({ text: result.output, type: 'ai' });
      }
      return result;
    }

    if (result.shouldShowSetup) {
      state.showSetup = true;
      state.setupDryRun = result.dryRun || false;
      return result;
    }

    if (result.shouldStartConnect) {
      startConnect();
      return result;
    }

    if (result.shouldStartGithub) {
      startGithub();
      return result;
    }

    if (result.shouldPromptModelToken) {
      state.modelStep = 'token';
      state.modelProvider = result.modelProvider;
      state.messages.push({ text: `Enter your ${result.modelProvider} API key:`, type: 'system' });
      return result;
    }

    if (result.needsConfirm) {
      state.confirmStep = {
        message: result.confirmMessage,
        onConfirm: result.onConfirm,
        onCancel: result.onCancel,
      };
      state.messages.push({ text: result.output, type: 'system' });
      return result;
    }

    if (result.output) {
      state.messages.push({ text: result.output, type: 'command' });
    }

    return result;
  }

  function exitAI() {
    if (state.aiMode) {
      disableAI();
    }
  }

  function exitSetup() {
    state.showSetup = false;
    state.setupDryRun = false;
  }

  function startConnect() {
    state.connectStep = 'select';
    state.connectCursor = 0;
    state.messages.push({ text: 'Select a platform:', type: 'system' });
  }

  function moveConnectCursor(direction) {
    const options = ['GitHub', 'GitLab'];
    state.connectCursor = (state.connectCursor + direction + options.length) % options.length;
  }

  function selectConnectPlatform() {
    const options = ['github', 'gitlab'];
    const names = ['GitHub', 'GitLab'];
    state.connectPlatform = options[state.connectCursor];
    state.connectStep = 'token';
    state.messages.push({ text: `Enter your ${names[state.connectCursor]} PAT:`, type: 'system' });
  }

  async function submitConnectToken(token) {
    const platform = state.connectPlatform;
    try {
      if (platform === 'github') {
        const gh = require('../integrations/github');
        const result = await gh.connect(token);
        state.messages.push({ text: `GitHub: connected as ${result.user.login}`, type: 'system' });
      } else {
        const gl = require('../integrations/gitlab');
        const result = await gl.connect(token);
        state.messages.push({ text: `GitLab: connected as ${result.user.username}`, type: 'system' });
      }
    } catch (err) {
      state.messages.push({ text: err.message, type: 'ai-error' });
    }
    state.connectStep = null;
    state.connectPlatform = null;
  }

  function cancelConnect() {
    state.messages.push({ text: 'Cancelled.', type: 'system' });
    state.connectStep = null;
    state.connectPlatform = null;
  }

  const GITHUB_OPTIONS = 4;

  function startGithub() {
    state.githubStep = 'select';
    state.githubCursor = 0;
    state.messages.push({ text: 'Select an action:', type: 'system' });
  }

  function moveGithubCursor(direction) {
    state.githubCursor = (state.githubCursor + direction + GITHUB_OPTIONS) % GITHUB_OPTIONS;
  }

  async function selectGithubItem() {
    const idx = state.githubCursor;
    state.githubStep = null;

    const subcommands = ['status', 'pr list', 'issue list', 'commit suggest'];
    await processInput(`github ${subcommands[idx]}`);
  }

  function cancelGithub() {
    state.messages.push({ text: 'Cancelled.', type: 'system' });
    state.githubStep = null;
  }

  async function submitModelToken(token) {
    const provider = state.modelProvider;
    const { getProvider } = require('../integrations/ai-providers/registry');
    const providerInfo = getProvider(provider);
    const config = await readConfig();
    config[`ai.${provider}Key`] = token;
    config.aiProvider = provider;
    await writeConfig(config);
    const name = providerInfo ? providerInfo.name : provider;
    state.messages.push({ text: `Provider switched to ${name} (${provider}).`, type: 'system' });
    state.modelStep = null;
    state.modelProvider = null;
  }

  function cancelModelToken() {
    state.messages.push({ text: 'Cancelled.', type: 'system' });
    state.modelStep = null;
    state.modelProvider = null;
  }

  async function confirmAction() {
    if (!state.confirmStep) return { output: null, shouldExit: false, shouldClear: false };
    const { onConfirm } = state.confirmStep;
    state.confirmStep = null;
    const result = await onConfirm();
    if (result.output) {
      state.messages.push({ text: result.output, type: 'system' });
    }
    return result;
  }

  function confirmCancel() {
    if (!state.confirmStep) return;
    const { onCancel } = state.confirmStep;
    state.confirmStep = null;
    const result = onCancel();
    if (result.output) {
      state.messages.push({ text: result.output, type: 'system' });
    }
    return result;
  }

  function markSetupDone() {
    state.setupInstalled = true;
  }

  function getStatusBar() {
    return {
      themeName: themeState.current,
      aiMode: state.aiMode,
      version: VERSION,
      activeProvider: state.activeProvider,
    };
  }

  function getSuggestions(input) {
    const trimmed = input.trim();
    const stripped = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return registry.autocomplete(stripped);
  }

  function getPlaceholder(input) {
    return getPlaceholderText(input, registry.getSubcommands);
  }

  return {
    get messages() { return state.messages; },
    theme,
    themeState,
    get aiMode() { return state.aiMode; },
    get showSetup() { return state.showSetup; },
    get setupDryRun() { return state.setupDryRun; },
    get connectStep() { return state.connectStep; },
    set connectStep(v) { state.connectStep = v; },
    get connectPlatform() { return state.connectPlatform; },
    get connectCursor() { return state.connectCursor; },
    processInput,
    getStatusBar,
    exitAI,
    exitSetup,
    moveConnectCursor,
    selectConnectPlatform,
    submitConnectToken,
    cancelConnect,
    get githubStep() { return state.githubStep; },
    get githubCursor() { return state.githubCursor; },
    moveGithubCursor,
    selectGithubItem,
    cancelGithub,
    submitModelToken,
    cancelModelToken,
    get modelStep() { return state.modelStep; },
    get modelProvider() { return state.modelProvider; },
    get aiLoading() { return state.aiLoading; },
    get upgradeLoading() { return state.upgradeLoading; },
    get confirmStep() { return state.confirmStep; },
    confirmAction,
    confirmCancel,
    markSetupDone,
    get setupInstalled() { return state.setupInstalled; },
    getSuggestions,
    getPlaceholder,
  };
}

module.exports = { createAppState, VERSION, WELCOME_TEXT };
