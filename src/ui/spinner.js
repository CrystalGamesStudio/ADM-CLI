const ora = require('ora');
const { resolveTheme } = require('./theme');

const NAMED_COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];

function toOraColor(color) {
  if (NAMED_COLORS.includes(color)) return color;
  return 'cyan';
}

function createSpinner(text, options = {}) {
  const theme = resolveTheme({});
  const rawColor = options.noColor ? 'white' : (options.color || theme.colors.primary);
  const spinnerColor = toOraColor(rawColor);
  const spinnerOpts = {
    text,
    color: spinnerColor,
    isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
  };

  const spinner = ora(spinnerOpts);

  return {
    get text() { return spinner.text; },
    set text(val) { spinner.text = val; },
    start() { spinner.start(); return spinner; },
    stop() { spinner.stop(); return spinner; },
    succeed(msg) { spinner.succeed(msg || text); return spinner; },
    fail(msg) { spinner.fail(msg || text); return spinner; },
    _ora: spinner,
  };
}

module.exports = { createSpinner };
