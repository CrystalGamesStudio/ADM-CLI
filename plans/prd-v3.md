# ADM CLI v3 — Issue #9 Fixes PRD

## Problem Statement

ADM CLI v2 TUI is functional but has several bugs and UX gaps identified in issue #9:

1. Setup summary shows installed/skipped/failed tools but **no pagination** — user cannot scroll with `<`/`>` arrows when many tools were processed
2. `/plugins` command exists but nobody knows what it does — should be removed entirely
3. `/model` requires manual config file editing to set API keys — no interactive CLI flow
4. `/config` dumps raw JSON with no useful purpose — should be removed
5. `/status`, `/pr`, `/issue`, `/commit` are scattered as separate commands — user wants unified `/github` with interactive list + subcommands
6. `/clock theme` shows a **gray screen** instead of the color picker
7. `/clock` displays time without visible colon separators (shows `14 30 45` instead of `14:30:45`)
8. No inline placeholder hints for command sub-actions (e.g. `/issue <view, delete, new>`)

## Solution

Fix all listed bugs and consolidate UX into a cleaner command set. Remove dead commands, add interactive flows where manual config was required, and unify scattered Git commands under `/github`.

## User Stories

### US-1: Paginated Setup Summary
As a developer, I want to scroll through the setup results with arrow keys when many tools were installed, so that I can see all installed/skipped/failed items.

### US-2: No /plugins Command
As a developer, I don't want to see a `/plugins` command that does nothing useful, so that the command list stays clean.

### US-3: Interactive /model Setup
As a developer, I want to type `/model groq` and either activate it (if configured) or get an inline input to paste my API key, so that I don't have to edit config files manually.

### US-4: No /config Command
As a developer, I don't want a `/config` command that dumps raw JSON, so that the command list only shows useful commands.

### US-5: Unified /github Command
As a developer, I want `/github` to show an interactive list of Git operations (status, PRs, issues, commits), and also support direct subcommands like `/github issue list`, so that all Git functionality is in one place.

### US-6: Working /clock theme
As a developer, I want `/clock theme` to show the color picker with live clock preview, not a gray screen.

### US-7: Clock with Colon Separators
As a developer, I want the ASCII clock to display `14:30:45` with visible colon separators, not `14 30 45`.

### US-8: Subcommand Placeholder Hints
As a developer, when I type `/issue` I want to see a placeholder like `<view, delete, new>` in the input bar, so that I know what sub-actions are available.

## Implementation Decisions

### ID-1: Setup Summary Pagination Fix
The setup summary step already has pagination code (`s.page`, `PAGE_SIZE`, result slicing) but the `allItems` array used for arrow-key navigation is empty in summary mode (only populated for categories/tools steps). The `useInput` handler uses `totalPages` derived from `allItems`, which is 0, so left/right arrows are ignored. **Fix**: In the summary step, derive pagination from `installResults` instead of `allItems`.

### ID-2: /plugins Removal
Remove `/plugins` from `BUILTIN_COMMANDS` array and delete `dispatchPlugins` function. Keep the plugin fallback mechanism (`dispatchPlugin`) since it handles `/<plugin-name>` execution.

### ID-3: Interactive /model Flow
When `/model <provider-id>` is called and the provider requires auth, enter a token input mode (similar to `/connect` token flow) instead of telling the user to use `/config set`. The app-state needs a new `modelStep` (`null` → `'token'`) and `modelProvider` to track which provider is being configured.

### ID-4: /config Removal
Remove `/config` from `BUILTIN_COMMANDS` array and delete `dispatchConfig` function. No migration needed.

### ID-5: /github Unified Command
Create new `dispatchGithub` function that:
- Without args: shows interactive list (status, PRs, issues, commits) with arrow selection, similar to `/connect` platform selection
- With args: routes to existing dispatch functions (`/github status` → `dispatchStatus`, `/github pr list` → `dispatchPr`, etc.)
- Remove `/status`, `/pr`, `/issue`, `/commit` from `BUILTIN_COMMANDS`
- Keep `/mr` as-is since it's GitLab-specific

### ID-6: /clock theme Gray Screen Fix
`clockThemePicker` uses `readline.emitKeypressEvents` and writes directly to `process.stdout` without entering alternate screen buffer (`\x1B[?1049h`). When invoked from within ink TUI, this creates a conflict — ink still owns the terminal, causing the gray screen. **Fix**: Add alternate screen buffer enter/exit around the clockThemePicker flow, matching the pattern used in `startClock`.

### ID-7: Clock Colon Visibility
The COLON ASCII glyph exists (`['       ', '   █   ', '       ', '   █   ', '       ']`) but renders with the same accent color as digits on some terminals, making the dots invisible. **Fix**: Render colon glyphs in `muted` color instead of accent color, making them visually distinct separators.

### ID-8: Subcommand Placeholder Hints
Add a `subcommands` field to `BUILTIN_COMMANDS` entries. When a command with subcommands is typed (e.g. `/issue `), show the subcommand list as placeholder text after the cursor, similar to shell autocomplete hints. This requires:
- Adding `subcommands` arrays to command definitions
- Rendering placeholder text in the input bar when input matches a command with known subcommands

## Deep Modules

### Module 1: Command Registry (`src/tui/commands/registry.js`)
**Interface**: `dispatch(input, context) → { output, flags }`
**Encapsulates**: All command routing, validation, help generation, subcommand definitions
**Changes**: Remove /plugins, /config, /status, /pr, /issue, /commit entries. Add /github. Add subcommand metadata. Modify /model for interactive flow.

### Module 2: App State (`src/tui/app-state.js`)
**Interface**: State management for TUI modes (AI, connect, setup, clock)
**Changes**: Add `modelStep` and `modelProvider` state for interactive /model API key input. Process `/model` token submission.

### Module 3: App Component (`src/tui/app.js`)
**Interface**: React/ink rendering of the full TUI
**Changes**: Add /model token input mode rendering. Add /github interactive list rendering. Add subcommand placeholder rendering in input bar. Fix clock theme alternate screen buffer.

## Assumptions

1. **Plugin fallback still works** after removing /plugins command — the `dispatchPlugin` function is separate
2. **/mr stays separate** since GitLab MR is a different workflow from GitHub PR
3. **API keys stored in config** — same location as current `/config set` approach, just with interactive input instead
4. **Alternate screen buffer** (`\x1B[?1049h`) is the correct fix for clock theme — it's what `startClock` already uses successfully
5. **Subcommand hints** are display-only metadata — no execution changes needed

## Tradeoffs Considered

- **Keep /status, /pr, /issue, /commit as aliases** — rejected because the user explicitly wants them consolidated into `/github` to reduce command clutter
- **Remove plugin system entirely** — rejected because the plugin fallback mechanism (`/<plugin-name>`) is useful; only the `/plugins` list command is dead
- **Full readline prompt for /model API key** — rejected in favor of inline ink input (matches /connect token flow pattern already in the codebase)
- **Autocomplete-style subcommand hints** (tab-complete) — rejected for v1 in favor of simple placeholder text; autocomplete can be added later

## Validation Strategy

| User Story | Verification |
|---|---|
| US-1 Setup pagination | Run `/setup`, complete install with 15+ tools, verify `<`/`>` arrows paginate the summary |
| US-2 No /plugins | `/help` output does not contain `plugins`; `/plugins` returns unknown command |
| US-3 Interactive /model | `/model groq` with no prior key → shows API key input → enter key → provider active. `/model groq` with key → immediately active |
| US-4 No /config | `/help` output does not contain `config`; `/config` returns unknown command |
| US-5 /github unified | `/github` shows interactive list; `/github status` shows git status; `/github pr list` shows PRs |
| US-6 Clock theme | `/clock theme` shows color picker with clock preview, not gray screen |
| US-7 Clock colon | `/clock` renders with visible `:` separators between H, M, S |
| US-8 Subcommand hints | Type `/github ` and see placeholder subcommands in input bar |

## Out of Scope

- Dotfiles functionality (deferred to separate issue)
- Plugin system removal (only removing /plugins list command)
- /mr command changes (stays as-is)
- AI provider API changes
- New GitHub/GitLab features beyond what exists

## Further Notes

- The setup summary pagination bug is caused by `allItems` being empty in summary mode while the `useInput` handler derives `totalPages` from it
- The clock theme gray screen is caused by missing alternate screen buffer (`\x1B[?1049h`) in `clockThemePicker`
- The /github command reuses existing dispatch functions internally — no need to rewrite GitHub/GitLab API logic
