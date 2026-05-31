const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { writeConfig, readConfig } = require('../config');
const { detectShell } = require('../shell/detector');
const { isNodeInstalled, installNode, getNodeVersion } = require('../installer/node-installer');
const { isPnpmInstalled, installPnpm } = require('../installer/package-manager-installer');
const { configureGit, getCurrentGitConfig } = require('../installer/git-config');
const { sshKeyExists, generateSshKey, getPublicKey } = require('../installer/ssh-setup');
const { detectPlatform, isBrewInstalled, installBrew, isAptInstalled, installAptPackages } = require('../installer/system-packages');

async function runSetup(options = {}) {
  const dry = process.env.ADM_DRY_RUN === '1' || options.dryRun;
  const shell = detectShell();

  console.log(chalk.cyan('\n  ADM Setup Wizard\n'));
  console.log(chalk.gray(`  Detected shell: ${shell}`));
  console.log(chalk.gray(`  Detected OS: ${detectPlatform()}\n`));

  if (dry) {
    return { dryRun: true, shell, platform: detectPlatform(), planned: getFullPlan() };
  }

  // Step 1: System package manager
  const platform = detectPlatform();
  if (platform === 'darwin' && !isBrewInstalled()) {
    const { installBrew: wantBrew } = await inquirer.prompt([{
      type: 'confirm', name: 'installBrew', message: 'Install Homebrew?', default: true,
    }]);
    if (wantBrew) {
      const s = ora('Installing Homebrew...').start();
      try { await installBrew(); s.succeed('Homebrew installed'); }
      catch (e) { s.fail(`Homebrew install failed: ${e.message}`); }
    }
  } else if (platform === 'linux' && !isAptInstalled()) {
    const { installApt } = await inquirer.prompt([{
      type: 'confirm', name: 'installApt', message: 'Install base apt packages (git, curl, build-essential)?', default: true,
    }]);
    if (installApt) {
      const s = ora('Installing apt packages...').start();
      try { await installAptPackages(); s.succeed('Apt packages installed'); }
      catch (e) { s.fail(`Apt install failed: ${e.message}`); }
    }
  }

  // Step 2: Node.js
  const nodeStatus = isNodeInstalled();
  let nodeVersion = nodeStatus.version;
  if (!nodeStatus.installed) {
    const { nodeChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'nodeChoice',
      message: 'Node.js is not installed. How would you like to install it?',
      choices: [
        { name: 'Install latest LTS (via nvm)', value: 'lts' },
        { name: 'Install specific version', value: 'custom' },
        { name: 'Skip Node.js installation', value: 'skip' },
      ],
      default: 'lts',
    }]);
    let customVersion;
    if (nodeChoice === 'custom') {
      ({ customVersion } = await inquirer.prompt([{
        type: 'input', name: 'customVersion', message: 'Enter Node.js version (e.g. 18.17.0):',
      }]));
    }
    if (nodeChoice !== 'skip') {
      const s = ora(`Installing Node.js ${nodeChoice === 'custom' ? customVersion : 'LTS'}...`).start();
      try {
        await installNode(nodeChoice === 'custom' ? customVersion : '--lts');
        nodeVersion = getNodeVersion();
        s.succeed(`Node.js installed: ${nodeVersion}`);
      } catch (e) {
        s.fail(`Node.js install failed: ${e.message}`);
      }
    }
  } else {
    console.log(chalk.green(`  Node.js ${nodeVersion} already installed`));
  }

  // Step 3: Package managers
  const pnpmStatus = isPnpmInstalled();
  if (!pnpmStatus.installed) {
    const { wantPnpm } = await inquirer.prompt([{
      type: 'confirm', name: 'wantPnpm', message: 'Install pnpm?', default: true,
    }]);
    if (wantPnpm) {
      const s = ora('Installing pnpm...').start();
      try { await installPnpm(); s.succeed('pnpm installed'); }
      catch (e) { s.fail(`pnpm install failed: ${e.message}`); }
    }
  } else {
    console.log(chalk.green(`  pnpm ${pnpmStatus.version} already installed`));
  }

  // Step 4: Optional tools
  const { tools } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'tools',
    message: 'Select optional tools to install:',
    choices: [
      { name: 'Vite', value: 'vite', checked: false },
      { name: 'esbuild', value: 'esbuild', checked: false },
      { name: 'TypeScript (tsc)', value: 'typescript', checked: false },
      { name: 'Docker (via system pkg)', value: 'docker', checked: false },
      { name: 'GitHub CLI (gh)', value: 'gh', checked: false },
    ],
  }]);
  if (tools.length > 0) {
    const s = ora(`Installing: ${tools.join(', ')}...`).start();
    try {
      for (const tool of tools) {
        if (['vite', 'esbuild', 'typescript'].includes(tool)) {
          const { execSync } = require('child_process');
          execSync(`npm install -g ${tool}`, { stdio: 'pipe' });
        } else if (tool === 'docker') {
          const { installSystemPackage } = require('../installer/system-packages');
          await installSystemPackage('docker.io');
        } else if (tool === 'gh') {
          const { installSystemPackage } = require('../installer/system-packages');
          await installSystemPackage('gh');
        }
      }
      s.succeed(`Installed: ${tools.join(', ')}`);
    } catch (e) {
      s.fail(`Tool install failed: ${e.message}`);
    }
  }

  // Step 5: Git config
  const currentGit = getCurrentGitConfig();
  const gitAnswers = await inquirer.prompt([
    {
      type: 'input', name: 'name', message: 'Git user.name:',
      default: currentGit.name || undefined,
    },
    {
      type: 'input', name: 'email', message: 'Git user.email:',
      default: currentGit.email || undefined,
    },
    {
      type: 'confirm', name: 'gpgsign', message: 'Enable GPG commit signing?',
      default: currentGit.gpgsign === 'true',
    },
  ]);
  await configureGit(gitAnswers);

  // Step 6: SSH key
  if (!sshKeyExists()) {
    const { wantSsh } = await inquirer.prompt([{
      type: 'confirm', name: 'wantSsh', message: 'Generate SSH key (ED25519)?', default: true,
    }]);
    if (wantSsh) {
      const result = generateSshKey(gitAnswers.email || 'adm@local');
      if (result.skipped) {
        console.log(chalk.yellow(`  ${result.reason}`));
      } else {
        console.log(chalk.green(`  SSH key generated: ${result.keyPath}`));
        console.log(chalk.gray(`  Public key: ${getPublicKey(result.keyPath).substring(0, 60)}...`));
      }
    }
  } else {
    console.log(chalk.green('  SSH key already exists'));
  }

  // Step 7: Dotfiles (optional)
  const { dotfilesUrl } = await inquirer.prompt([{
    type: 'input', name: 'dotfilesUrl', message: 'Dotfiles repo URL (leave empty to skip):',
  }]);
  if (dotfilesUrl) {
    const s = ora('Cloning dotfiles...').start();
    try {
      const { execSync } = require('child_process');
      const dotfilesDir = require('path').join(require('os').homedir(), '.adm', 'dotfiles');
      execSync(`git clone "${dotfilesUrl}" "${dotfilesDir}"`, { stdio: 'pipe' });
      s.succeed(`Dotfiles cloned to ${dotfilesDir}`);
    } catch (e) {
      s.fail(`Dotfiles clone failed: ${e.message}`);
    }
  }

  // Step 8: Assistant mode
  const { assistant } = await inquirer.prompt([{
    type: 'confirm', name: 'assistant', message: 'Enable assistant mode?', default: false,
  }]);

  // Save config
  const config = {
    installed: true,
    setupCompletedAt: new Date().toISOString(),
    shell,
    platform,
    nodeVersion,
    pnpm: pnpmStatus.installed || (await isPnpmInstalled()).installed,
    tools,
    git: { name: gitAnswers.name, email: gitAnswers.email, gpgsign: gitAnswers.gpgsign },
    assistant,
    dotfiles: dotfilesUrl || null,
  };
  await writeConfig(config);

  console.log(chalk.cyan('\n  Setup complete! Config saved to ~/.adm/config.json\n'));
  return config;
}

function getFullPlan() {
  return [
    'Detect and install system package manager (brew/apt)',
    'Install Node.js via nvm',
    'Install pnpm',
    'Install optional tools (Vite, esbuild, TypeScript, Docker, gh)',
    'Configure git (user.name, user.email, gpgsign)',
    'Generate SSH key (ED25519)',
    'Clone dotfiles repo',
    'Enable assistant mode',
    'Save config to ~/.adm/config.json',
  ];
}

module.exports = { runSetup };
