# Phase 6: Polish & Release

> User Stories: All (MVP completion and distribution)

## What to Build

Final polish, error handling, documentation, and release automation.

**Deliverables:**
1. Comprehensive error handling across all commands (user-friendly messages, exit codes)
2. Shell completion scripts (Bash, Zsh)
3. `adm --help` and `adm <command> --help` documentation
4. User-facing documentation (README, quick-start guide, troubleshooting)
5. Curl installer automation and hosting
6. Homebrew tap creation and automation
7. Release automation (versioning, changelog, binary builds)
8. End-to-end smoke tests (setup, install, all major commands)
9. Performance profiling and optimization (startup time < 1s)

## Assumptions Carried In

- Phases 1-5 are complete and stable
- GitHub repo is created and accessible
- CI/CD pipeline is available (GitHub Actions or similar)
- Domain (adm.sh) or CDN is available for installer script
- Homebrew tap repo exists and maintainer can push

## Out of Scope for This Phase

- Advanced monitoring / telemetry (Phase 1: Enhancements)
- Community plugin registry / marketplace (Phase 1: Enhancements)
- Localization / i18n (Phase 1: Enhancements)
- Windows support (out of scope entirely)

## Acceptance Criteria

- [ ] All commands have comprehensive error handling with exit codes (0 = success, 1 = error, 2 = user error) — [test: trigger various error conditions, verify exit codes]
- [ ] Error messages are user-friendly and suggest remediation (e.g., "Token expired. Run: adm connect github") — [test: use expired GitHub token, verify error message includes remediation]
- [ ] Shell completion (bash/zsh) works; tab-completion suggests commands and arguments — [manual test: source completion script, type `adm pr <tab>`, verify completions appear]
- [ ] `adm --help` displays all commands and global options — [command: `adm --help` output is complete and readable]
- [ ] `adm <command> --help` displays command-specific help and examples — [command: `adm setup --help` shows setup-specific options and examples]
- [ ] README includes quick-start, installation, core commands, troubleshooting — [observable: README.md exists and covers all major sections]
- [ ] Curl installer script is functional; `curl https://adm.sh/install | sh` works on macOS and Linux — [test: run on fresh VMs]
- [ ] Homebrew formula is functional; `brew install adm-cli/core/adm` installs latest version — [test: run on macOS with Homebrew]
- [ ] Release script automates versioning (semver), changelog generation, binary builds — [test: run release script, verify version bumped, changelog updated, binaries built]
- [ ] End-to-end smoke tests pass (setup, install, all major commands) — [automated test suite runs on fresh environment]
- [ ] Startup time < 1 second on typical hardware (measure `time adm status`) — [benchmark: verify startup performance]
- [ ] No console errors or warnings during normal operation — [test: run all commands, capture stdout/stderr, verify no unexpected warnings]
- [ ] Uninstall is clean; no leftover files or registry entries after `adm uninstall` — [test: uninstall on fresh VM, verify no traces remain]

## Key Components to Implement

- `src/utils/error-handler.js` — Centralized error handling and messaging
- `scripts/completion.bash` — Bash completion script
- `scripts/completion.zsh` — Zsh completion script
- `README.md` — Main documentation
- `docs/quickstart.md` — Quick-start guide
- `docs/troubleshooting.md` — Common issues and solutions
- `scripts/release.sh` — Release automation script
- `scripts/install.sh` (refine from Phase 1) — Production-ready curl installer
- `.github/workflows/release.yml` — GitHub Actions release workflow
- `homebrew/adm.rb` (refine from Phase 1) — Production Homebrew formula
- `tests/e2e/*.test.js` — End-to-end smoke tests
- `CHANGELOG.md` — Release notes and versioning

