const {
  getInstallCommand,
  isToolInstalled,
  installTools,
} = require('../../../src/setup/installer');

describe('installer', () => {
  describe('getInstallCommand', () => {
    test('npm maps to "npm install -g <tool>" on darwin', () => {
      const cmd = getInstallCommand(
        { id: 'vite', name: 'Vite', installMethod: 'npm' },
        'darwin',
      );
      expect(cmd).toBe('npm install -g vite');
    });

    test('npm maps to "npm install -g <tool>" on linux', () => {
      const cmd = getInstallCommand(
        { id: 'vite', name: 'Vite', installMethod: 'npm' },
        'linux',
      );
      expect(cmd).toBe('npm install -g vite');
    });

    test('brew maps to "brew install <tool>" on darwin', () => {
      const cmd = getInstallCommand(
        { id: 'jq', name: 'jq', installMethod: 'brew' },
        'darwin',
      );
      expect(cmd).toBe('brew install jq');
    });

    test('brew maps to "sudo apt-get install -y <tool>" on linux', () => {
      const cmd = getInstallCommand(
        { id: 'jq', name: 'jq', installMethod: 'brew' },
        'linux',
      );
      expect(cmd).toBe('sudo apt-get install -y jq');
    });

    test('pip maps to "pip install <tool>"', () => {
      const cmd = getInstallCommand(
        { id: 'black', name: 'Black', installMethod: 'pip' },
        'darwin',
      );
      expect(cmd).toBe('pip install black');
    });

    test('cargo maps to "cargo install <tool>"', () => {
      const cmd = getInstallCommand(
        { id: 'ripgrep', name: 'ripgrep', installMethod: 'cargo' },
        'darwin',
      );
      expect(cmd).toBe('cargo install ripgrep');
    });

    test('go maps to "go install <tool>@latest"', () => {
      const cmd = getInstallCommand(
        { id: 'golangci-lint', name: 'golangci-lint', installMethod: 'go' },
        'darwin',
      );
      expect(cmd).toBe('go install golangci-lint@latest');
    });

    test('gem maps to "gem install <tool>"', () => {
      const cmd = getInstallCommand(
        { id: 'rails', name: 'Rails', installMethod: 'gem' },
        'darwin',
      );
      expect(cmd).toBe('gem install rails');
    });

    test('composer maps to "composer global require <tool>"', () => {
      const cmd = getInstallCommand(
        { id: 'phpstan', name: 'PHPStan', installMethod: 'composer' },
        'darwin',
      );
      expect(cmd).toBe('composer global require phpstan');
    });

    test('dotnet maps to "dotnet tool install -g <tool>"', () => {
      const cmd = getInstallCommand(
        { id: 'dotnet-ef', name: 'EF CLI', installMethod: 'dotnet' },
        'darwin',
      );
      expect(cmd).toBe('dotnet tool install -g dotnet-ef');
    });

    test('script maps to curl|bash placeholder', () => {
      const cmd = getInstallCommand(
        { id: 'rustup', name: 'rustup', installMethod: 'script' },
        'darwin',
      );
      expect(cmd).toContain('curl');
      expect(cmd).toContain('rustup');
    });
  });

  describe('isToolInstalled', () => {
    test('returns true when tool is found', () => {
      const execSync = jest.fn(() => Buffer.from('/usr/bin/git'));
      const result = isToolInstalled({ id: 'git', name: 'Git', installMethod: 'brew' }, execSync);
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('git'), expect.any(Object));
    });

    test('returns false when tool is not found', () => {
      const execSync = jest.fn(() => { throw new Error('not found'); });
      const result = isToolInstalled({ id: 'nonexistent', name: 'Nope', installMethod: 'brew' }, execSync);
      expect(result).toBe(false);
    });
  });

  describe('installTools', () => {
    test('installs selected tools sequentially', async () => {
      const execSync = jest.fn((cmd) => {
        if (cmd.includes('command -v')) throw new Error('not found');
        return Buffer.from('ok');
      });
      const tools = [
        { id: 'vite', name: 'Vite', installMethod: 'npm' },
        { id: 'jq', name: 'jq', installMethod: 'brew' },
      ];
      const results = await installTools(tools, 'darwin', execSync);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('installed');
      expect(results[1].status).toBe('installed');
      expect(execSync).toHaveBeenCalledTimes(4); // 2 which-checks + 2 installs
    });

    test('skips already-installed tools', async () => {
      const execSync = jest.fn((cmd) => {
        if (cmd.includes('command -v')) return Buffer.from('/usr/bin/vite');
        return Buffer.from('ok');
      });
      const tools = [
        { id: 'vite', name: 'Vite', installMethod: 'npm' },
      ];
      const results = await installTools(tools, 'darwin', execSync);
      expect(results[0].status).toBe('skipped');
    });

    test('reports failure when install command fails', async () => {
      let callCount = 0;
      const execSync = jest.fn(() => {
        callCount++;
        if (callCount <= 1) throw new Error('not found'); // which check — not installed
        if (callCount === 2) throw new Error('install failed'); // install fails
        return Buffer.from('ok');
      });
      const tools = [
        { id: 'bad-tool', name: 'Bad', installMethod: 'npm' },
      ];
      const results = await installTools(tools, 'darwin', execSync);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('install failed');
    });

    test('returns summary with installed/skipped/failed counts', async () => {
      let callCount = 0;
      const execSync = jest.fn((cmd) => {
        callCount++;
        if (cmd.includes('command -v') && callCount === 1) return Buffer.from('/usr/bin/git'); // which — installed
        if (cmd.includes('command -v')) throw new Error('not found'); // which — not installed
        if (callCount === 3) throw new Error('install failed'); // install fails for 'bad'
        return Buffer.from('ok');
      });
      const tools = [
        { id: 'git', name: 'Git', installMethod: 'brew' }, // already installed → skip
        { id: 'bad', name: 'Bad', installMethod: 'npm' }, // not installed, install fails
      ];
      const results = await installTools(tools, 'darwin', execSync);
      const summary = {
        installed: results.filter(r => r.status === 'installed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: results.filter(r => r.status === 'failed').length,
      };
      expect(summary.skipped).toBe(1);
      expect(summary.failed).toBe(1);
    });
  });
});
