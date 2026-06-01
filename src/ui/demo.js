#!/usr/bin/env node
const chalk = require('chalk');
const { renderClock } = require('./ascii-clock');
const { getRandomQuote } = require('../utils/quotes');
const { resolveTheme } = require('./theme');
const { createSpinner } = require('./spinner');
const {
  detectColorSupport,
  isDarkMode,
  isCI,
  isTTY,
  shouldEnableAnimations,
} = require('../utils/terminal-detection');

console.log(chalk.bold('\n=== ADM-CLI Phase 4: Vibe Features Demo ===\n'));

// 1. Terminal detection
console.log(chalk.cyan('--- Terminal Detection ---'));
console.log(`  Color support: ${detectColorSupport() ? chalk.green('yes') : chalk.red('no')}`);
console.log(`  Dark mode:     ${isDarkMode() ? 'yes' : 'no'}`);
console.log(`  TTY:           ${isTTY() ? 'yes' : 'no'}`);
console.log(`  CI:            ${isCI() ? 'yes' : 'no'}`);
console.log(`  Animations:    ${shouldEnableAnimations({ animations: true }) ? 'enabled' : 'disabled'}`);

// 2. Theme
console.log(chalk.cyan('\n--- Theme (dark) ---'));
const dark = resolveTheme({ theme: 'dark' });
console.log(`  primary:  ${chalk.hex(dark.colors.primary)('■■■■')} ${dark.colors.primary}`);
console.log(`  accent:   ${chalk.hex(dark.colors.accent)('■■■■')} ${dark.colors.accent}`);
console.log(`  success:  ${chalk.hex(dark.colors.success)('■■■■')} ${dark.colors.success}`);
console.log(`  warning:  ${chalk.hex(dark.colors.warning)('■■■■')} ${dark.colors.warning}`);
console.log(`  error:    ${chalk.hex(dark.colors.error)('■■■■')} ${dark.colors.error}`);

console.log(chalk.cyan('\n--- Theme (light) ---'));
const light = resolveTheme({ theme: 'light' });
console.log(`  primary:  ${chalk.hex(light.colors.primary)('■■■■')} ${light.colors.primary}`);
console.log(`  text:     ${chalk.hex(light.colors.text)('■■■■')} ${light.colors.text}`);

console.log(chalk.cyan('\n--- Theme (custom) ---'));
const custom = resolveTheme({ theme: { primary: '#ff6600', accent: '#00ffcc' } });
console.log(`  primary:  ${chalk.hex(custom.colors.primary)('■■■■')} ${custom.colors.primary}`);
console.log(`  accent:   ${chalk.hex(custom.colors.accent)('■■■■')} ${custom.colors.accent}`);

// 3. ASCII Clock
console.log(chalk.cyan('\n--- ASCII Clock ---'));
const now = new Date();
const lines = renderClock(now);
const timeStr = now.toLocaleTimeString();
console.log(chalk.hex(dark.colors.primary)(lines.join('\n')));
console.log(chalk.gray(`  ${timeStr}`));

// 4. Quote
console.log(chalk.cyan('\n--- Random Dev Quote ---'));
const quote = getRandomQuote();
console.log(chalk.italic(`  "${quote.text}"`));
console.log(chalk.gray(`  — ${quote.author}`));

// 5. Spinner
console.log(chalk.cyan('\n--- Spinner Demo ---'));
const spinner = createSpinner('Loading something...', { isEnabled: true });
spinner.start();
setTimeout(() => {
  spinner.text = 'Almost done...';
}, 1000);
setTimeout(() => {
  spinner.succeed('Done!');
  console.log(chalk.green('\nDemo complete!\n'));
}, 2500);
