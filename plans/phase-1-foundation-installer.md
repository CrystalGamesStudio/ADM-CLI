# Phase 1: Foundation + Installer

> User Stories: US-1 (First-Time Setup)

## What to Build

End-to-end installer and foundational CLI that allows new developers to install ADM and run an interactive setup wizard to configure their dev environment.

**Deliverables:**
1. Node.js project scaffold with package.json, bin/adm entry point, basic command structure
2. Multi-platform installer script supporting:
   - `curl https://adm.sh/install | sh`
   - `bash installer.sh` / `zsh installer.sh`
   - `brew install adm-cli/core/adm`
   - `sudo` elevation detection and prompting
   - Shell detection (Bash, Zsh, unsupported shells)
3. `adm setup` interactive wizard that prompts for:
   - Node.js version selection (LTS or custom)
   - Package managers (pnpm, npm)
   - Optional tools (Vite, esbuild, Docker, git, gh-cli)
   - Git user.name, user.email setup
   - Optional SSH key generation (ED25519)
   - Optional dotfiles repo URL
   - Optional assistant mode enablement
4. Package installer system (nvm for Node.js, npm/pnpm, brew/apt wrappers)
5. Config persistence at `~/.adm/config.json` with setup state
6. `adm uninstall` command for cleanup

## Assumptions Carried In

- Node.js v18+ is available or can be installed via nvm
- macOS has Homebrew; Linux has apt/yum
- Bash or Zsh is the target shell
- Network is available during setup (downloads, git clone)
- User has sudo permissions if elevation is needed

## Out of Scope for This Phase

- GitHub/GitLab connection (Phase 2)
- Interactive assistant mode (Phase 3)
- Vibe features like ASCII clock (Phase 4)
- Plugin system (Phase 5)
- Dotfiles sync mechanics (Phase 5)
- Homebrew tap automation (Phase 6)
- Shell completion (Phase 6)

## Acceptance Criteria

- [ ] Project scaffold created with `package.json`, `bin/adm` entry point, `src/` structure — [observable: `ls -la bin/adm`, `npm run build` succeeds]
- [ ] `adm setup` command exists and launches interactive wizard — [command: `adm setup --dry-run` shows all prompts]
- [ ] Installer script downloads ADM binary and installs to `/usr/local/bin/adm` — [command: `bash installer.sh` on fresh VM, verify `which adm` returns `/usr/local/bin/adm`]
- [ ] Installer detects shell (Bash vs Zsh) and warns if unsupported — [test: installer run in different shells, logs detected shell type]
- [ ] Installer supports `sudo` prefix and prompts for password if needed — [command: `sudo bash installer.sh` completes without error]
- [ ] Node.js installer (via nvm) works; `node -v` and `npm -v` succeed after setup — [command: `adm setup` with Node.js selection, verify `node -v` works in new shell]
- [ ] pnpm installer works; `pnpm -v` succeeds after setup — [command: `adm setup` with pnpm selection, verify `pnpm -v` works]
- [ ] Git config (user.name, user.email) is applied to `~/.gitconfig` — [observable: `git config --get user.name` returns expected value]
- [ ] SSH key generation (ED25519) works when selected, no prompt on rerun if key exists — [test: setup wizard skips SSH prompt if key already exists]
- [ ] Config persisted to `~/.adm/config.json` with all setup choices — [observable: `cat ~/.adm/config.json | jq .` shows all installed tools, settings]
- [ ] `adm uninstall` removes ADM binary, config, and shell references cleanly — [command: `adm uninstall`, verify `which adm` returns empty]
- [ ] Installer works on macOS (Big Sur+) and Linux (Ubuntu 20.04+) — [manual test on both platforms]
- [ ] Brew tap is functional; `brew install adm-cli/core/adm` installs ADM — [command: `brew install adm-cli/core/adm` on macOS]

## Key Components to Implement

- `bin/adm` — Main CLI entry point (shebang, argument routing)
- `src/commands/setup.js` — Interactive setup wizard using inquirer.js
- `src/installer/node-installer.js` — nvm-based Node.js installation
- `src/installer/package-manager-installer.js` — pnpm/npm installation
- `src/installer/system-packages.js` — brew/apt wrapper for utilities
- `src/installer/git-config.js` — Git configuration
- `src/installer/ssh-setup.js` — SSH key generation and management
- `src/utils/config.js` — Config reading/writing at `~/.adm/config.json`
- `src/utils/shell-detection.js` — Detect Bash vs Zsh vs unsupported
- `scripts/installer.sh` — Bash/Zsh installer script
- `scripts/install.js` — Post-install setup launcher
- `Homebrew/adm.rb` — Homebrew formula

