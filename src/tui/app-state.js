const { createRegistry } = require('./commands/registry');
const { resolveTheme } = require('../ui/theme');
const ai = require('../integrations/ai-backend');
const { getKnowledge } = require('../ai/knowledge');

const VERSION = 'v0.2.0';
const WELCOME_TEXT = 'Welcome to ADM! Type /help for commands or /setup to install developer tools.';

function createAppState() {
  const config = {};
  const themeState = { current: 'dark' };
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
  };

  let knowledge = null;
  try {
    knowledge = getKnowledge(VERSION, process.cwd());
  } catch {
    // knowledge unavailable — continue without it
  }

  function disableAI() {
    state.aiMode = false;
    state.messages.push({ text: 'AI: off', type: 'system' });
  }

  async function processInput(input) {
    const trimmed = input.trim();

    // In AI mode, intercept /exit and /ai to leave/toggle AI mode
    const cmd = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    if (state.aiMode && (cmd === 'exit' || cmd === 'ai')) {
      state.aiMode = false;
      state.messages.push({ text: 'Exited AI mode.', type: 'system' });
      return { output: null, shouldExit: false, shouldClear: false };
    }

    // In AI mode, send non-command input directly to AI backend
    if (state.aiMode) {
      try {
        const messages = [];
        if (knowledge) {
          messages.push({ role: 'system', content: knowledge });
        }
        messages.push({ role: 'user', content: input });
        const response = await ai.query(input, { messages });
        state.messages.push({ text: `GLM: ${response}`, type: 'ai' });
      } catch (err) {
        state.messages.push({ text: `AI error: ${err.message}`, type: 'ai-error' });
      }
      return { output: null, shouldExit: false, shouldClear: false };
    }

    const result = await registry.dispatch(input);

    if (result.shouldClear) {
      state.messages.length = 0; // mutate in-place so external refs stay valid
      return result;
    }

    if (result.shouldToggleAI) {
      state.aiMode = !state.aiMode;
      const label = state.aiMode ? 'AI: ON — type a question, /exit to leave AI mode' : 'AI: off';
      state.messages.push({ text: label, type: 'system' });
      return result;
    }

    if (result.shouldShowSetup) {
      state.showSetup = true;
      state.setupDryRun = result.dryRun || false;
      return result;
    }

    if (result.shouldRunClock) {
      state.runClock = true;
      return result;
    }

    if (result.shouldRunClockTheme) {
      state.runClockTheme = true;
      return result;
    }

    if (result.shouldStartConnect) {
      startConnect();
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

  function clearClockFlags() {
    state.runClock = false;
    state.runClockTheme = false;
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

  function markSetupDone() {
    state.setupInstalled = true;
  }

  function getStatusBar() {
    return {
      themeName: themeState.current,
      aiMode: state.aiMode,
      version: VERSION,
    };
  }

  function getSuggestions(input) {
    const trimmed = input.trim();
    const stripped = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return registry.autocomplete(stripped);
  }

  return {
    get messages() { return state.messages; },
    theme,
    themeState,
    get aiMode() { return state.aiMode; },
    get showSetup() { return state.showSetup; },
    get setupDryRun() { return state.setupDryRun; },
    get runClock() { return state.runClock; },
    set runClock(v) { state.runClock = v; },
    get runClockTheme() { return state.runClockTheme; },
    set runClockTheme(v) { state.runClockTheme = v; },
    get connectStep() { return state.connectStep; },
    set connectStep(v) { state.connectStep = v; },
    get connectPlatform() { return state.connectPlatform; },
    get connectCursor() { return state.connectCursor; },
    processInput,
    getStatusBar,
    exitAI,
    exitSetup,
    clearClockFlags,
    moveConnectCursor,
    selectConnectPlatform,
    submitConnectToken,
    cancelConnect,
    markSetupDone,
    get setupInstalled() { return state.setupInstalled; },
    getSuggestions,
  };
}

module.exports = { createAppState, VERSION, WELCOME_TEXT };
