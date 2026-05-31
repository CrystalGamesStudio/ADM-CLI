# Phase 3: Assistant Shell

> User Stories: US-3 (Daily Assistant)

## What to Build

Interactive REPL assistant that runs in the terminal and provides AI-powered suggestions, GitHub integration, and developer workflow shortcuts.

**Deliverables:**
1. `adm --assistant` or `adm` (no args) launches interactive shell/REPL
2. Built-in commands:
   - `ai <question>` — Ask Claude/GPT for code suggestions, debugging, explanations
   - `pr list` — List open PRs (cached from Phase 2)
   - `pr draft <title>` — Create draft PR from current branch
   - `commit suggest` — Suggest commit message based on staged git changes
   - `status` — Show git status, pending PRs, issues assigned to you
   - `open <repo/org/branch>` — Clone repo or jump to branch
   - `app launch <name>` — Launch configured apps (VSCode, Docker, etc.)
   - `help` — Show command reference
3. AI backend integration (OpenAI, Anthropic, or configurable)
4. Command history and fuzzy search
5. Graceful exit handling (Ctrl+C, `exit` command)
6. Colored output and formatting

## Assumptions Carried In

- Phase 1 (setup) and Phase 2 (GitHub) are complete
- GitHub connection is optional but recommended
- AI API keys can be stored securely (via config or environment variables)
- User has git repo in current directory (for commit, status, open commands)

## Out of Scope for This Phase

- Vibe features (animations, ASCII clock) — Phase 4
- GitLab integration — Phase 5
- Live PR/issue notifications — Phase 1: Enhancements
- Voice input / multimodal interaction — Future
- IDE integration — Phase 1: Enhancements

## Acceptance Criteria

- [ ] `adm --assistant` launches interactive REPL that accepts commands — [manual test: start assistant, verify prompt appears and accepts input]
- [ ] `ai <question>` sends query to AI backend and streams response — [command: `ai "how to debug async/await?"` returns formatted answer]
- [ ] `pr list` displays open PRs from Phase 2, cached and refreshable — [command: `pr list` in assistant shows cached PRs or fetches new ones]
- [ ] `pr draft <title>` creates draft PR from current branch — [observable: draft PR appears on GitHub within 2s]
- [ ] `commit suggest` analyzes staged changes and suggests commit message — [test: stage changes, run command, verify suggestion is contextual and sensible]
- [ ] `status` shows git status (modified files, staged changes) and assigned issues — [command: `status` outputs formatted git + GitHub status]
- [ ] `open <repo>` clones repo or jumps to branch in current repo — [test: `open owner/repo` clones to ~/projects/repo; `open my-branch` checks out existing branch]
- [ ] `app launch <name>` launches configured app (e.g., `app launch vscode` opens VS Code) — [test: add app to config, run command, verify app launches]
- [ ] Command history is preserved across sessions (readline-like behavior) — [manual test: restart assistant, verify `arrow-up` recalls previous command]
- [ ] Fuzzy search available for commands (e.g., type `p` + tab-complete shows `pr list`, `pr draft`) — [manual test: type `p` in REPL, tab-complete shows matching commands]
- [ ] `exit` or Ctrl+C cleanly closes assistant without errors — [command: type `exit`, verify clean shutdown]
- [ ] Colored output renders correctly on Terminal, iTerm2, Linux shells — [manual test on multiple terminal emulators]
- [ ] AI API errors (rate limits, auth failures, network) are handled with retry logic — [test: mock API error, verify user-friendly message and retry prompt]

## Key Components to Implement

- `src/commands/assistant.js` — Main REPL entry point
- `src/repl/shell.js` — Interactive shell using `repl` or `vorpal.js`
- `src/repl/commands/ai.js` — AI query integration
- `src/repl/commands/pr.js` — PR subcommands within REPL
- `src/repl/commands/commit.js` — Commit suggestion logic
- `src/repl/commands/status.js` — Git + GitHub status display
- `src/repl/commands/open.js` — Repository cloning and branch navigation
- `src/repl/commands/app-launch.js` — Application launcher
- `src/integrations/ai-backend.js` — OpenAI/Anthropic API wrapper
- `src/utils/command-history.js` — History persistence
- `src/utils/fuzzy-search.js` — Tab-completion and fuzzy matching

