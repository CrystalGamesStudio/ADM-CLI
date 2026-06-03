const inquirer = require('inquirer');
const chalk = require('chalk');
const { resolveTheme, listThemes } = require('../ui/theme');
const { readConfig, writeConfig } = require('../config');

/**
 * adm theme — interactive theme selector with live preview.
 * Arrow keys to browse, Enter to apply, theme saved to ~/.adm/config.json.
 */
async function themeCommand() {
  const config = await readConfig();
  const currentTheme = config.theme || 'dark';
  const themes = listThemes();

  // ── Show current theme ────────────────────────────────
  console.log('');
  const cur = resolveTheme(config);
  const cc = cur.colors;
  console.log(
    chalk.hex(cc.primary)('  Current: ') +
    chalk.hex(cc.accent)(cur.name) +
    chalk.hex(cc.muted)(' (' + currentTheme + ')')
  );
  console.log('');

  // ── Build preview for each theme ──────────────────────
  const choices = themes.map(t => {
    const c = t.colors;
    const block = (hex) => chalk.hex(hex)('██');
    const label =
      '  ' +
      block(c.primary) + block(c.accent) + block(c.secondary) +
      '  ' +
      chalk.hex(c.primary).bold(t.name.padEnd(10)) +
      chalk.hex(c.muted)('adm> ') +
      chalk.hex(c.text)('hello') + ' ' +
      chalk.hex(c.success)('✓') + ' ' +
      chalk.hex(c.error)('✗') + ' ' +
      chalk.hex(c.warning)('⚠');

    return {
      name: label,
      value: t.name,
      short: t.name,
    };
  });

  // ── Interactive selection ──────────────────────────────
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Choose a theme:',
      choices,
      default: currentTheme,
      pageSize: themes.length,
      loop: false,
    },
  ]);

  // ── Save to config ────────────────────────────────────
  if (selected === currentTheme) {
    const t = resolveTheme({ theme: selected });
    console.log('');
    console.log(chalk.hex(t.colors.muted)('  Already using ' + selected + ' theme.'));
    console.log('');
    return;
  }

  const newConfig = { ...config, theme: selected };
  await writeConfig(newConfig);

  const t = resolveTheme({ theme: selected });
  const nc = t.colors;
  console.log('');
  console.log(
    chalk.hex(nc.success)('  ✓ Theme saved: ') +
    chalk.hex(nc.primary).bold(selected)
  );
  console.log(
    chalk.hex(nc.muted)('  ~/.adm/config.json updated') +
    chalk.hex(nc.text)(' — restart adm to see changes everywhere.')
  );
  console.log('');

  // ── Show preview of new theme ─────────────────────────
  showPreview(nc, selected);
}

function showPreview(c, name) {
  const border = chalk.hex(c.primary);
  const pad = '                ';
  console.log('');
  console.log(border('  ┌──────────────────────────────────┐'));
  console.log(border('  │ ') + chalk.hex(c.text).bold('  ADM') + chalk.hex(c.muted)(' · ' + name) + pad.slice(0, Math.max(0, 18 - name.length)) + border('│'));
  console.log(border('  │ ') + chalk.hex(c.muted)('  adm> ') + chalk.hex(c.text)('status') + pad.slice(0, 12) + border('│'));
  console.log(border('  │ ') + chalk.hex(c.success)('  ✓ All systems go') + pad.slice(0, 10) + border('│'));
  console.log(border('  │ ') + chalk.hex(c.accent)('  ██ ██') + chalk.hex(c.text)('  12:34') + pad.slice(0, 10) + border('│'));
  console.log(border('  └──────────────────────────────────┘'));
  console.log('');
}

module.exports = { themeCommand };
