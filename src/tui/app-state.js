const { createRegistry } = require('./commands/registry');
const { resolveTheme } = require('../ui/theme');

const VERSION = 'v0.2.0';
const WELCOME_TEXT = 'Welcome to ADM! Type /help for commands.';

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
  };

  async function processInput(input) {
    const result = await registry.dispatch(input);

    if (result.shouldClear) {
      state.messages.length = 0; // mutate in-place so external refs stay valid
      return result;
    }

    if (result.output) {
      state.messages.push({ text: result.output, type: 'command' });
    }

    return result;
  }

  function getStatusBar() {
    return {
      themeName: themeState.current,
      aiMode: state.aiMode,
      version: VERSION,
    };
  }

  return { messages: state.messages, theme, themeState, aiMode: state.aiMode, processInput, getStatusBar };
}

module.exports = { createAppState, VERSION, WELCOME_TEXT };
