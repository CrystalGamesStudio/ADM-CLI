const React = require('react');
const { createAppState } = require('./app-state');

function createApp(ink) {
  const { Box, Text, useInput, useApp } = ink;

  return function App() {
    const stateRef = React.useRef(createAppState());
    const [messages, setMessages] = React.useState(stateRef.current.messages);
    const [input, setInput] = React.useState('');
    const { exit } = useApp();

    useInput(async (ch, key) => {
      if (key.ctrl && ch === 'c') {
        exit();
        return;
      }

      if (key.return) {
        const trimmed = input.trim();
        if (trimmed === '') return;
        const result = await stateRef.current.processInput(trimmed);
        setInput('');
        setMessages([...stateRef.current.messages]);
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

    return React.createElement(
      Box,
      { flexDirection: 'column' },
      // StatusBar
      React.createElement(
        Box,
        { borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
        React.createElement(Text, { color: 'cyan' }, bar.themeName),
        React.createElement(Text, { color: 'gray' }, ' │ '),
        React.createElement(Text, { color: bar.aiMode ? 'green' : 'gray' }, `AI: ${bar.aiMode ? 'ON' : 'off'}`),
        React.createElement(Text, { color: 'gray' }, ' │ '),
        React.createElement(Text, { color: 'yellow' }, `ADM ${bar.version}`),
      ),
      // Messages
      React.createElement(
        Box,
        { flexDirection: 'column', flexGrow: 1, paddingX: 1 },
        ...messages.map((msg, i) =>
          React.createElement(Text, { key: i, wrap: 'wrap' }, msg.text)
        ),
      ),
      // Input bar
      React.createElement(
        Box,
        { borderStyle: 'single', borderColor: 'blue', paddingX: 1 },
        React.createElement(Text, { color: 'green' }, '> '),
        React.createElement(Text, null, input),
        React.createElement(Text, { dimColor: true }, '█'),
      ),
    );
  };
}

async function boot() {
  const ink = await import('ink');
  const App = createApp(ink);
  const { render } = ink;
  const { waitUntilExit } = render(React.createElement(App));
  await waitUntilExit();
}

module.exports = { createApp, boot };
