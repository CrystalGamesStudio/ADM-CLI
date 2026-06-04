const readline = require('readline');
const chalk = require('chalk');
const { renderClock } = require('../ui/ascii-clock');
const { resolveTheme } = require('../ui/theme');
const { readConfig, writeConfig } = require('../config');

// ── Rainbow + classic presets ──────────────────────────────
const COLORS = [
  { name: 'Red',      hex: '#ff0000' },
  { name: 'Orange',   hex: '#ff8800' },
  { name: 'Yellow',   hex: '#ffdd00' },
  { name: 'Green',    hex: '#00ff88' },
  { name: 'Cyan',     hex: '#00ffff' },
  { name: 'Blue',     hex: '#4488ff' },
  { name: 'Indigo',   hex: '#4400ff' },
  { name: 'Purple',   hex: '#aa00ff' },
  { name: 'Pink',     hex: '#ff00aa' },
  { name: 'White',    hex: '#ffffff' },
  { name: 'Custom…',  hex: null },
];

/**
 * adm clock theme — live preview color picker.
 * Arrow keys change color → clock updates instantly.
 * Enter to confirm. Custom → type hex.
 */
async function clockThemePicker() {
  const config = await readConfig();
  const theme = resolveTheme(config);
  const current = config.clockAccent || theme.colors.accent;

  return new Promise((resolve) => {
    let idx = 0;

    // Enable keypress events
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();

    function draw() {
      // Use the color under cursor (or current for Custom…)
      const active = COLORS[idx].hex || current;
      const lines = renderClock(new Date());
      const w = process.stdout.columns || 80;
      const cw = lines[0].length;
      const pad = ' '.repeat(Math.max(0, Math.floor((w - cw) / 2)));

      // Clear + home
      process.stdout.write('\x1B[2J\x1B[H');

      // Title
      process.stdout.write(chalk.hex(active).bold('\n  Clock Color Picker\n'));

      // Clock preview in active color
      for (const line of lines) {
        process.stdout.write(pad + chalk.hex(active)(line) + '\n');
      }

      process.stdout.write('\n');

      // Color list
      for (let i = 0; i < COLORS.length; i++) {
        const c = COLORS[i];
        const cursor = i === idx ? chalk.hex(active)('❯ ') : '  ';
        if (c.hex) {
          const swatch = chalk.hex(c.hex)('█████');
          const label = i === idx ? chalk.bold.white(c.name.padEnd(9)) : chalk.gray(c.name.padEnd(9));
          const code = chalk.gray(c.hex);
          process.stdout.write('  ' + cursor + swatch + ' ' + label + code + '\n');
        } else {
          const label = i === idx ? chalk.bold.white('Custom…') : chalk.gray('Custom…');
          process.stdout.write('  ' + cursor + chalk.gray('      ') + label + '\n');
        }
      }

      // Footer
      process.stdout.write(chalk.gray('\n  ↑↓ move · Enter confirm · Esc cancel\n'));
    }

    draw();

    function onKeypress(_str, key) {
      if (!key) return;

      if (key.name === 'up') {
        idx = (idx - 1 + COLORS.length) % COLORS.length;
        draw();
      } else if (key.name === 'down') {
        idx = (idx + 1) % COLORS.length;
        draw();
      } else if (key.name === 'return') {
        cleanup();

        const chosen = COLORS[idx];

        if (!chosen.hex) {
          // Custom — prompt for hex input
          handleCustomInput(config, current, resolve);
        } else {
          saveColor(config, chosen.hex, resolve);
        }
      } else if (key.name === 'escape' || (key.name === 'c' && key.ctrl)) {
        cleanup();
        process.stdout.write('\x1B[2J\x1B[H  Cancelled.\n\n');
        resolve();
      }
    }

    function cleanup() {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.on('keypress', onKeypress);
  });
}

/**
 * Handle custom hex input (exits raw mode, uses readline question).
 */
function handleCustomInput(config, fallback, done) {
  process.stdout.write('\x1B[2J\x1B[H');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(chalk.gray('  Enter hex color (e.g. #FF5500): '), async (answer) => {
    rl.close();
    const hex = answer.trim();

    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      console.log(chalk.red('\n  Invalid format. Must be #RRGGBB.\n'));
      done();
      return;
    }

    const color = hex.toLowerCase();

    // Show preview
    const lines = renderClock(new Date());
    const w = process.stdout.columns || 80;
    const cw = lines[0].length;
    const pad = ' '.repeat(Math.max(0, Math.floor((w - cw) / 2)));
    console.log('');
    for (const line of lines) {
      console.log(pad + chalk.hex(color)(line));
    }
    console.log('');

    saveColor(config, color, done);
  });
}

async function saveColor(config, color, done) {
  const newConfig = { ...config, clockAccent: color };
  await writeConfig(newConfig);

  // Clear screen — TUI will take over
  process.stdout.write('\x1B[2J\x1B[H');
  done();
}

module.exports = { clockThemePicker };
