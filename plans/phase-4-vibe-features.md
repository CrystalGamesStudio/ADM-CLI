# Phase 4: Vibe Features

> User Stories: US-6 (Vibe Features)

## What to Build

Visual polish and personality for the CLI — animations, themes, and developer-focused aesthetics.

**Deliverables:**
1. ASCII clock with animation that runs in standby mode (idle state)
2. Animated ASCII art rendering without breaking on slow terminals
3. Theme support (dark, light, custom)
4. Random developer quotes displayed alongside clock
5. Color scheme adaptation to terminal dark/light mode detection
6. Optional animations configuration (enable/disable via config)
7. Smooth transitions and spinners for long-running operations

## Assumptions Carried In

- Phase 1 (setup and config) is complete
- Terminal supports ANSI color codes (most modern terminals do)
- `chalk` library is available for color output
- `ora` library is available for spinners

## Out of Scope for This Phase

- Complex ASCII animations beyond clock (Phase 1: Enhancements)
- Custom font rendering — MVP uses figlet only
- Accessibility features (high-contrast mode, screen reader support) — Phase 1: Enhancements
- Web dashboard or TUI (full-screen UI) — Phase 1: Enhancements

## Acceptance Criteria

- [ ] ASCII clock animates in assistant standby mode, refreshing every 5 seconds — [manual test: start assistant, go idle, verify clock animates continuously]
- [ ] ASCII clock displays current time and random dev quote — [observable: clock shows HH:MM:SS + quote below]
- [ ] Animations do not break on slow terminals (animation disabled gracefully if terminal too slow) — [test: simulate slow terminal, verify clock renders without corruption]
- [ ] Theme detection works (dark/light mode auto-detected from terminal) — [manual test on Terminal.app (light) and iTerm2 (dark), verify colors adapt]
- [ ] Theme can be overridden via config (`~/.adm/config.json` theme setting) — [test: set theme to "dark" in config, run assistant, verify colors match]
- [ ] Custom theme support (user can specify RGB or named colors in config) — [observable: `~/.adm/config.json` accepts custom color definitions and renders correctly]
- [ ] Spinners appear during long-running operations (setup, install, API calls) — [manual test: run `adm setup` with simulated delays, verify spinners display]
- [ ] Color output can be disabled (e.g., `adm --no-color`) for piping or CI/CD — [command: `adm --no-color status` outputs plain text without ANSI codes]
- [ ] Animations are optional and performant (< 5% CPU usage during idle animation) — [manual test: monitor CPU usage during clock animation]
- [ ] ASCII art renders correctly on macOS (Terminal, iTerm2) and Linux (bash, zsh, common terminal emulators) — [manual test on multiple platforms]

## Key Components to Implement

- `src/ui/ascii-clock.js` — ASCII clock animation logic
- `src/ui/theme.js` — Theme manager (colors, styles)
- `src/ui/theme/dark.js` — Dark theme colors
- `src/ui/theme/light.js` — Light theme colors
- `src/ui/animations.js` — General animation framework
- `src/utils/terminal-detection.js` — Detect terminal capabilities (dark/light mode, ANSI support)
- `src/utils/quotes.js` — Developer quote database
- `src/ui/spinner.js` — Spinner wrapper using `ora`

