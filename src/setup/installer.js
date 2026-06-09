const { promisify } = require('util');
const execAsync = promisify(require('child_process').exec);
const execSync = require('child_process').execSync;
const path = require('path');
const os = require('os');
const fs = require('fs');

const SCRIPT_URLS = {
  rustup: 'https://sh.rustup.rs',
  bun: 'https://bun.sh/install',
  conda: 'https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh',
  gcloud: 'https://sdk.cloud.google.com',
  'azure-cli': 'https://aka.ms/InstallAzureCli',
  composer: 'https://getcomposer.org/installer',
  vcpkg: 'https://github.com/microsoft/vcpkg',
  'oh-my-zsh': 'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh',
};

// Ensure npm uses a user-writable directory (fixes EACCES without sudo)
let _npmFixed = false;
function ensureNpmPrefix() {
  if (_npmFixed) return;
  _npmFixed = true;
  try {
    const prefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    const userPrefix = path.join(os.homedir(), '.npm-global');
    const userBin = path.join(userPrefix, 'bin');
    const needsPrefixChange = prefix === '/usr/local' || prefix === '/usr';
    const needsPathFix = !process.env.PATH.split(':').includes(userBin);

    if (needsPrefixChange) {
      if (!fs.existsSync(userPrefix)) {
        fs.mkdirSync(userBin, { recursive: true });
      }
      execSync(`npm config set prefix '${userPrefix}'`, { stdio: 'pipe' });
    }

    // Always ensure PATH is set — even if prefix was already changed before
    if (needsPathFix || needsPrefixChange) {
      addToShellPath(userBin);
    }
  } catch {
    // Can't fix — will fail later with helpful message
  }
}

// Add directory to PATH in shell config (.zshrc or .bashrc)
function addToShellPath(dir) {
  const marker = '# adm-cli npm path';
  const exportLine = `export PATH="${dir}:\$PATH"  ${marker}`;

  const shellRc = process.env.SHELL && process.env.SHELL.includes('zsh')
    ? path.join(os.homedir(), '.zshrc')
    : path.join(os.homedir(), '.bashrc');

  try {
    let content = '';
    if (fs.existsSync(shellRc)) {
      content = fs.readFileSync(shellRc, 'utf8');
    }
    // Remove old adm path entries
    const lines = content.split('\n').filter(l => !l.includes(marker));
    lines.push(exportLine);
    fs.writeFileSync(shellRc, lines.join('\n'), 'utf8');
  } catch {
    // Can't write to shell rc — user will need to add manually
  }

  // Also set in current process so subsequent installs find tools
  process.env.PATH = `${dir}:${process.env.PATH}`;
}

function getNpmBinPath() {
  try {
    const prefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    return path.join(prefix, 'bin');
  } catch {
    return '';
  }
}

function getInstallCommand(tool, platform) {
  const method = tool.installMethod;
  const id = tool.id;

  const commands = {
    npm: `npm install -g ${id}`,
    brew: platform === 'darwin' ? `brew install ${id}` : `sudo apt-get install -y ${id}`,
    pip: `pip install ${id}`,
    cargo: `cargo install ${id}`,
    go: `go install ${id}@latest`,
    gem: `gem install ${id}`,
    composer: `composer global require ${id}`,
    dotnet: `dotnet tool install -g ${id}`,
    script: `curl -fsSL ${SCRIPT_URLS[id] || 'https://example.com/install'} | sh`,
    nvm: `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash`,
    node: `npm install -g ${id}`,
    python: `python3 -m pip install ${id}`,
    rustup: `rustup component add ${id}`,
    apt: `sudo apt-get install -y ${id}`,
    manual: `# Manual install required for ${id}`,
  };

  if (method === 'link') {
    return `echo 'Visit: ${tool.url || tool.id}'`;
  }

  return commands[method] || `# Unknown install method: ${method}`;
}

function isToolInstalled(tool, checkFn) {
  const check = checkFn || execSync;
  const cmd = tool.command || tool.id;
  try {
    check(`command -v ${cmd} >/dev/null 2>&1`, { shell: '/bin/bash', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function installToolAsync(tool, platform) {
  if (tool.installMethod === 'link') {
    return { id: tool.id, name: tool.name, status: 'link', message: `Visit marketplace: ${tool.url || 'N/A'}` };
  }

  if (isToolInstalled(tool)) {
    return { id: tool.id, name: tool.name, status: 'skipped', message: 'already installed' };
  }

  // For npm/node methods, fix permissions first
  if (tool.installMethod === 'npm' || tool.installMethod === 'node') {
    ensureNpmPrefix();
  }

  const cmd = getInstallCommand(tool, platform);
  try {
    await execAsync(cmd, { shell: '/bin/bash' });
    // Refresh PATH so subsequent tools can find this one
    refreshPath();
    return { id: tool.id, name: tool.name, status: 'installed', message: 'installed' };
  } catch (err) {
    const stderr = err.stderr || '';
    let hint = '';
    if (stderr.includes('EACCES')) {
      hint = 'Fix: npm config set prefix ~/.npm-global && add ~/.npm-global/bin to PATH';
    }
    return { id: tool.id, name: tool.name, status: 'failed', error: (stderr.split('\n')[0] || err.message), hint, command: cmd };
  }
}

// Refresh PATH by reading shell rc files (picks up new tool paths like ~/.bun/bin)
function refreshPath() {
  const home = os.homedir();
  const extraDirs = [
    path.join(home, '.npm-global', 'bin'),
    path.join(home, '.bun', 'bin'),
    path.join(home, '.cargo', 'bin'),
    path.join(home, 'go', 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ];
  for (const dir of extraDirs) {
    if (fs.existsSync(dir) && !process.env.PATH.split(':').includes(dir)) {
      process.env.PATH = `${dir}:${process.env.PATH}`;
    }
  }
}

async function installTools(tools, platform, checkFn) {
  const run = checkFn || execSync;
  const results = [];

  for (const tool of tools) {
    if (isToolInstalled(tool, run)) {
      results.push({ id: tool.id, name: tool.name, status: 'skipped', message: `${tool.name} is already installed` });
      continue;
    }

    const cmd = getInstallCommand(tool, platform);
    try {
      run(cmd, { shell: '/bin/bash', stdio: 'pipe' });
      results.push({ id: tool.id, name: tool.name, status: 'installed', message: `${tool.name} installed` });
    } catch (err) {
      results.push({ id: tool.id, name: tool.name, status: 'failed', error: err.message });
    }
  }

  return results;
}

module.exports = { getInstallCommand, isToolInstalled, installTools, installToolAsync };
