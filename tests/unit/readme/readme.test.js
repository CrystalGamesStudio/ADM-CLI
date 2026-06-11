const fs = require('fs');
const path = require('path');

const readmePath = path.resolve(__dirname, '../../../README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

describe('README.md', () => {
  describe('declares TUI-only nature', () => {
    it('states the project is TUI-only or single-command', () => {
      const hasTuiOnly =
        readme.includes('TUI-only') ||
        readme.includes('TUI only') ||
        readme.includes('single command') ||
        readme.includes('One command');

      expect(hasTuiOnly).toBe(true);
    });
  });

  describe('documents new TUI commands', () => {
    const commandSection = readme.match(/\| Command \|.*\n(\|[-|\s]+\|\n)?([\s\S]*?)(?=\n###|\n##|$)/)?.[0] || '';

    it('includes /download in TUI commands table', () => {
      expect(commandSection).toMatch(/\/download/);
    });

    it('includes /gitlab in TUI commands table', () => {
      expect(commandSection).toMatch(/\/gitlab/);
    });

    it('includes /feedback in TUI commands table', () => {
      expect(commandSection).toMatch(/\/feedback/);
    });
  });

  describe('has no removed CLI subcommands', () => {
    const removedCommands = [
      'adm setup',
      'adm connect',
      'adm pr',
      'adm mr',
      'adm issue-list',
      'adm installers',
      'adm dotfiles',
      'adm clock',
      'adm theme',
      'adm uninstall',
    ];

    it.each(removedCommands)('does not contain "%s" as a CLI command', (cmd) => {
      const asCliCommand = new RegExp(`^\\s*${cmd.replace(/\s+/, '\\s+')}`, 'm');
      expect(asCliCommand.test(readme)).toBe(false);
    });
  });

  describe('Quick Start section', () => {
    const quickStart = readme.match(/## Quick Start[\s\S]*?(?=\n## )/)?.[0] || '';

    it('does not list adm setup as a CLI command', () => {
      expect(quickStart).not.toMatch(/^adm setup/m);
    });

    it('shows adm as the single entry point', () => {
      expect(quickStart).toMatch(/adm/);
    });
  });
});
