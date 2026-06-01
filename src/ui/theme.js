const darkTheme = require('./theme/dark');
const lightTheme = require('./theme/light');

const presets = { dark: darkTheme, light: lightTheme };

function getTheme(name) {
  const theme = presets[name];
  if (!theme) throw new Error(`Unknown theme: "${name}". Available: ${Object.keys(presets).join(', ')}`);
  return theme;
}

function resolveTheme(config = {}) {
  const { theme } = config;

  if (!theme || theme === 'auto') {
    return darkTheme;
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

module.exports = { resolveTheme, getTheme };
