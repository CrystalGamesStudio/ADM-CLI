const darkTheme = require('./theme/dark');
const lightTheme = require('./theme/light');
const cyberpunkTheme = require('./theme/cyberpunk');
const nordTheme = require('./theme/nord');
const forestTheme = require('./theme/forest');
const monokaiTheme = require('./theme/monokai');
const { isDarkMode } = require('../utils/terminal-detection');

const presets = {
  dark: darkTheme,
  light: lightTheme,
  cyberpunk: cyberpunkTheme,
  nord: nordTheme,
  forest: forestTheme,
  monokai: monokaiTheme,
};

function getTheme(name) {
  const theme = presets[name];
  if (!theme) throw new Error(`Unknown theme: "${name}". Available: ${Object.keys(presets).join(', ')}`);
  return theme;
}

function listThemes() {
  return Object.values(presets);
}

function resolveTheme(config = {}) {
  const { theme } = config;

  if (!theme || theme === 'auto') {
    return isDarkMode() ? darkTheme : lightTheme;
  }

  if (typeof theme === 'string') {
    return getTheme(theme);
  }

  if (typeof theme === 'object') {
    return {
      name: 'custom',
      colors: { ...darkTheme.colors, ...theme },
    };
  }

  return darkTheme;
}

module.exports = { resolveTheme, getTheme, listThemes };
