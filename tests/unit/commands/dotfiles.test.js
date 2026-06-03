// Założenia:
// - adm dotfiles sync klonuje/pulluje repo do ~/.adm/dotfiles/ i uruchamia syncDotfiles
// - Repo URL z config (dotfiles.repo)
// - Opcje: --copy, --only <pliki>, --repo <url>
// - Mockujemy: child_process (git), config, inquirer (dla konfliktów)

jest.mock('../../../src/config', () => ({
  readConfig: jest.fn().mockResolvedValue({ dotfiles: { repo: 'https://github.com/user/dotfiles' } }),
  ensureConfigDir: jest.fn(),
}));

jest.mock('../../../src/utils/dotfiles-sync', () => ({
  syncDotfiles: jest.fn().mockResolvedValue({
    symlinked: ['.bashrc'],
    copied: [],
    skipped: [],
    backedUp: [],
    errors: [],
  }),
}));

const child_process = require('child_process');
jest.spyOn(child_process, 'execSync').mockImplementation(() => '');

const { syncDotfilesCommand } = require('../../../src/commands/dotfiles');
const dotfilesSync = require('../../../src/utils/dotfiles-sync');

describe('adm dotfiles sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('wywołuje git clone gdy repo nie istnieje', async () => {
    await syncDotfilesCommand({ repo: 'https://github.com/user/dotfiles' });
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone'),
      expect.any(Object),
    );
  });

  test('wywołuje git pull gdy repo już istnieje', async () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    // Symuluj istniejące repo
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-dotcmd-'));
    const dotfilesDir = path.join(tmpDir, 'dotfiles');
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.git'), ''); // symuluje git repo
    process.env.ADM_CONFIG_DIR = tmpDir;

    await syncDotfilesCommand({ repo: 'https://github.com/user/dotfiles' });
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining('git pull'),
      expect.any(Object),
    );

    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('wywołuje syncDotfiles z odpowiednimi opcjami', async () => {
    await syncDotfilesCommand({ repo: 'https://github.com/user/dotfiles', copy: true, only: ['bashrc'] });
    expect(dotfilesSync.syncDotfiles).toHaveBeenCalledWith(
      expect.objectContaining({
        copy: true,
        only: ['bashrc'],
      }),
    );
  });
});
