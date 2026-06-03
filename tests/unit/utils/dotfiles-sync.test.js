// Założenia (Assumptions):
// - Repo dotfiles klonowane do ~/.adm/dotfiles/
// - URL repo zapisany w config jako dotfiles.repo
// - Domyślnie symlink, flaga --copy dla kopii
// - Domyślna lista plików: .bashrc, .zshrc, .gitconfig, .ssh/config
// - Konflikty: "pomiń" lub "kopia zapasowa + zastąp" (brak merge)
// --only filtruje pliki do synchronizacji
// - Uprawnienia plików są zachowywane (np. +x)
// - Mockujemy: child_process (git clone/pull), system plików (fs)

const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');

// Mockujemy execSync na granicy systemu
jest.spyOn(child_process, 'execSync');

const { syncDotfiles } = require('../../../src/utils/dotfiles-sync');
const { handleConflict } = require('../../../src/utils/file-conflict-handler');

describe('Dotfiles Sync', () => {
  let tmpDir;
  let homeDir;
  let dotfilesDir;
  let configDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-dotfiles-'));
    configDir = path.join(tmpDir, 'adm');
    dotfilesDir = path.join(configDir, 'dotfiles');
    homeDir = path.join(tmpDir, 'home');
    fs.mkdirSync(homeDir, { recursive: true });
    process.env.ADM_CONFIG_DIR = configDir;
    process.env.ADM_TEST_HOME = homeDir;
  });

  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    delete process.env.ADM_TEST_HOME;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('syncDotfiles tworzy symlinki z repo do katalogu domowego', async () => {
    // Symulujemy sklonowane repo dotfiles
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.bashrc'), 'echo hello');
    fs.writeFileSync(path.join(dotfilesDir, '.zshrc'), 'echo zsh');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
    });

    expect(result.symlinked).toContain('.bashrc');
    expect(result.symlinked).toContain('.zshrc');
    expect(fs.readlinkSync(path.join(homeDir, '.bashrc'))).toBe(path.join(dotfilesDir, '.bashrc'));
  });

  test('syncDotfiles kopiuje pliki gdy --copy', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.gitconfig'), '[user]');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      copy: true,
    });

    expect(result.copied).toContain('.gitconfig');
    const content = fs.readFileSync(path.join(homeDir, '.gitconfig'), 'utf8');
    expect(content).toBe('[user]');
  });

  test('syncDotfiles pomija pliki z konfliktem gdy brak zgody na zastąpienie', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.bashrc'), 'nowy content');
    // Istniejący plik w home
    fs.writeFileSync(path.join(homeDir, '.bashrc'), 'stary content');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      onConflict: () => 'skip',
    });

    expect(result.skipped).toContain('.bashrc');
    // Oryginalny plik niezmieniony
    expect(fs.readFileSync(path.join(homeDir, '.bashrc'), 'utf8')).toBe('stary content');
  });

  test('syncDotfiles tworzy backup i zastępuje gdy zgoda', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.bashrc'), 'nowy content');
    fs.writeFileSync(path.join(homeDir, '.bashrc'), 'stary content');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      onConflict: () => 'backup',
    });

    expect(result.backedUp).toContain('.bashrc');
    // Backup istnieje
    expect(fs.existsSync(path.join(homeDir, '.bashrc.backup'))).toBe(true);
    expect(fs.readFileSync(path.join(homeDir, '.bashrc.backup'), 'utf8')).toBe('stary content');
    // Nowy plik symlinked
    expect(fs.readlinkSync(path.join(homeDir, '.bashrc'))).toBe(path.join(dotfilesDir, '.bashrc'));
  });

  test('syncDotfiles filtruje pliki z --only', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    fs.writeFileSync(path.join(dotfilesDir, '.bashrc'), 'bash');
    fs.writeFileSync(path.join(dotfilesDir, '.zshrc'), 'zsh');
    fs.writeFileSync(path.join(dotfilesDir, '.gitconfig'), 'git');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      only: ['bashrc', 'zshrc'],
    });

    expect(result.symlinked).toContain('.bashrc');
    expect(result.symlinked).toContain('.zshrc');
    expect(result.symlinked).not.toContain('.gitconfig');
  });

  test('syncDotfiles zachowuje uprawnienia pliku (+x)', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    const scriptPath = path.join(dotfilesDir, 'setup.sh');
    fs.writeFileSync(scriptPath, '#!/bin/bash\necho hi');
    fs.chmodSync(scriptPath, 0o755);

    await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      files: ['setup.sh'],
    });

    const targetPath = path.join(homeDir, 'setup.sh');
    expect(fs.existsSync(targetPath)).toBe(true);
    const stat = fs.statSync(targetPath);
    expect(stat.mode & 0o111).toBeTruthy(); // execute bit
  });

  test('syncDotfiles tworzy katalog docelowy dla .ssh/config', async () => {
    fs.mkdirSync(dotfilesDir, { recursive: true });
    const sshDir = path.join(dotfilesDir, '.ssh');
    fs.mkdirSync(sshDir, { recursive: true });
    fs.writeFileSync(path.join(sshDir, 'config'), 'Host github.com');

    const result = await syncDotfiles({
      repo: '/fake/repo',
      homeDir,
      files: ['.ssh/config'],
    });

    expect(result.symlinked).toContain('.ssh/config');
    expect(fs.existsSync(path.join(homeDir, '.ssh'))).toBe(true);
  });
});

describe('File Conflict Handler', () => {
  test('handleConflict zwraca "skip" dla braku pliku', () => {
    const result = handleConflict({
      targetPath: '/nonexistent/.bashrc',
      sourcePath: '/dotfiles/.bashrc',
    });
    expect(result).toBe('no-conflict');
  });

  test('handleConflict wykrywa konflikt gdy plik istnieje', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-conflict-'));
    const targetPath = path.join(tmpDir, '.bashrc');
    fs.writeFileSync(targetPath, 'stary');

    const result = handleConflict({
      targetPath,
      sourcePath: '/dotfiles/.bashrc',
    });
    expect(result).toBe('conflict');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
