const React = require('react');
const { createAppState } = require('./app-state');
const { createSetupScreen } = require('./components/SetupScreen');
const { startClock } = require('../commands/clock');
const { clockThemePicker } = require('../commands/clock-theme');
const { resolveTheme } = require('../ui/theme');
const { readConfig } = require('../config');

function createApp(ink) {
  const { Box, Text, useInput, useApp } = ink;
  const SetupScreen = createSetupScreen(ink);

  return function App() {
    const stateRef = React.useRef(createAppState());
    _lastAppState = stateRef.current;
    const [messages, setMessages] = React.useState(stateRef.current.messages);
    const [input, setInput] = React.useState('');
    const [showSetup, setShowSetup] = React.useState(false);
    const [showClock, setShowClock] = React.useState(false);
    const { exit } = useApp();

    // Full-screen clock: when flag is set, run startClock outside ink
    React.useEffect(() => {
      if (stateRef.current.runClock) {
        stateRef.current.runClock = false;
        setShowClock(true);
        readConfig().then(cfg => {
          startClock(cfg || {}, () => {
            process.stdout.write('\x1B[2J\x1B[H');
            setShowClock(false);
            stateRef.current.clearClockFlags();
          });
        });
      }
    }, [stateRef.current.runClock]);

    React.useEffect(() => {
      if (stateRef.current.runClockTheme) {
        stateRef.current.runClockTheme = false;
        setShowClock(true);
        clockThemePicker().then(() => {
          process.stdout.write('\x1B[2J\x1B[H');
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
          }
          setShowClock(false);
          stateRef.current.clearClockFlags();
          stateRef.current.messages.push({ text: 'Clock theme saved.', type: 'system' });
          rerender();
        });
      }
    }, [stateRef.current.runClockTheme]);

    const rerender = () => {
      setMessages([...stateRef.current.messages]);
      setShowSetup(stateRef.current.showSetup);
    };

    useInput(async (ch, key) => {
      // When setup screen is active, delegate input handling
      if (stateRef.current.showSetup) {
        if (key.escape) {
          stateRef.current.exitSetup();
          rerender();
        }
        return;
      }

      // Tab — autocomplete command
      if (key.tab) {
        if (!stateRef.current.aiMode && input.startsWith('/')) {
          const suggestions = stateRef.current.getSuggestions(input);
          if (suggestions.length === 1) {
            setInput('/' + suggestions[0] + ' ');
          }
        }
        return;
      }

      // Esc — exit AI mode (does NOT quit app)
      if (key.escape) {
        stateRef.current.exitAI();
        rerender();
        return;
      }

      if (key.ctrl && ch === 'c') {
        exit();
        return;
      }

      if (key.return) {
        const trimmed = input.trim();
        if (trimmed === '') return;
        const result = await stateRef.current.processInput(trimmed);
        setInput('');
        rerender();
        if (result.shouldExit) {
          exit();
        }
        return;
      }

      if (key.backspace || key.delete) {
        setInput(prev => prev.slice(0, -1));
        return;
      }

      if (ch && !key.ctrl && !key.meta) {
        setInput(prev => prev + ch);
      }
    });

    const bar = stateRef.current.getStatusBar();
    const aiMode = bar.aiMode;
    const suggestions = !aiMode && input.startsWith('/') ? stateRef.current.getSuggestions(input) : [];

    // Resolve theme colors from current theme name
    const themeName = stateRef.current.themeState.current;
    let tc;
    try {
      tc = resolveTheme({ theme: themeName }).colors;
    } catch {
      tc = resolveTheme({}).colors;
    }

    // When clock is running full-screen, don't render anything
    if (showClock) {
      return null;
    }

    // When setup is active, render SetupScreen instead of main view
    if (stateRef.current.showSetup) {
      return React.createElement(
        Box,
        { flexDirection: 'column' },
        // StatusBar
        React.createElement(
          Box,
          { borderStyle: 'single', borderColor: tc.muted, paddingX: 1 },
          React.createElement(Text, { color: tc.primary }, bar.themeName),
          React.createElement(Text, { color: tc.muted }, ' │ '),
          React.createElement(Text, { color: tc.accent }, 'Setup Wizard'),
          React.createElement(Text, { color: tc.muted }, ' │ '),
          React.createElement(Text, { color: tc.warning }, `ADM ${bar.version}`),
        ),
        React.createElement(SetupScreen, {
          onExit: () => {
            stateRef.current.exitSetup();
            stateRef.current.markSetupDone();
            rerender();
          },
          dryRun: stateRef.current.setupDryRun,
          platform: process.platform,
        }),
      );
    }

    return React.createElement(
      Box,
      { flexDirection: 'column' },
      // StatusBar
      React.createElement(
        Box,
        { borderStyle: 'single', borderColor: tc.muted, paddingX: 1 },
        React.createElement(Text, { color: tc.primary }, bar.themeName),
        React.createElement(Text, { color: tc.muted }, ' │ '),
        React.createElement(Text, { color: aiMode ? tc.success : tc.muted }, `AI: ${aiMode ? 'ON' : 'off'}`),
        React.createElement(Text, { color: tc.muted }, ' │ '),
        React.createElement(Text, { color: tc.warning }, `ADM ${bar.version}`),
      ),
      // Messages
      React.createElement(
        Box,
        { flexDirection: 'column', flexGrow: 1, paddingX: 1 },
        ...messages.map((msg, i) =>
          React.createElement(Text, { key: i, wrap: 'wrap', color: tc.text }, msg.text)
        ),
      ),
      // Suggestions
      suggestions.length > 0 && React.createElement(
        Box,
        { paddingX: 1 },
        React.createElement(Text, { dimColor: true, color: tc.accent }, suggestions.map(s => `/${s}`).join('  ')),
      ),
      // Input bar — accent color when AI mode is ON
      React.createElement(
        Box,
        { borderStyle: 'single', borderColor: aiMode ? tc.secondary : tc.muted, paddingX: 1 },
        React.createElement(Text, { color: aiMode ? tc.secondary : tc.success }, aiMode ? 'AI> ' : '> '),
        React.createElement(Text, { color: aiMode ? tc.secondary : tc.text }, input),
        React.createElement(Text, { dimColor: true }, '█'),
      ),
    );
  };
}

let _lastAppState = null;

async function boot() {
  const ink = await import('ink');
  const App = createApp(ink);
  const { render } = ink;
  const { waitUntilExit } = render(React.createElement(App));
  await waitUntilExit();

  // After TUI exits, show PATH refresh hint if setup installed tools
  if (_lastAppState && _lastAppState.setupInstalled) {
    console.log('\n  Tools installed! Run: source ~/.zshrc\n');
  }
}

module.exports = { createApp, boot };
