const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');

async function uninstall() {
  const configDir = process.env.ADM_CONFIG_DIR || path.join(os.homedir(), '.adm');

  console.log(chalk.yellow('  Uninstalling ADM CLI...\n'));

  // Remove config directory
  try {
    await fs.rm(configDir, { recursive: true, force: true });
    console.log(chalk.green(`  Removed config directory: ${configDir}`));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.log(chalk.red(`  Failed to remove config: ${err.message}`));
    }
  }

  // Remove shell completions references
  const shell = process.env.SHELL || '';
  const rcFiles = [];
  if (shell.includes('bash')) {
    rcFiles.push(path.join(os.homedir(), '.bashrc'), path.join(os.homedir(), '.bash_profile'));
  } else if (shell.includes('zsh')) {
    rcFiles.push(path.join(os.homedir(), '.zshrc'));
  }

  for (const rc of rcFiles) {
    try {
      let content = await fs.readFile(rc, 'utf8');
      const cleaned = content.split('\n').filter(
        line => !line.includes('adm completion') && !line.includes('source.*adm'),
      ).join('\n');
      if (content !== cleaned) {
        await fs.writeFile(rc, cleaned, 'utf8');
        console.log(chalk.green(`  Cleaned ADM references from ${rc}`));
      }
    } catch { /* skip missing rc files */ }
  }

  console.log(chalk.green('\n  ADM CLI uninstalled. Remove the binary manually if needed:'));
  console.log(chalk.gray('    rm -f /usr/local/bin/adm'));
  return true;
}

module.exports = { uninstall };
