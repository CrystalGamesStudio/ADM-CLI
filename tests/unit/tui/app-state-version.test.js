/**
 * TDD — Issue #20: dynamic version in TUI status bar
 *
 * Tests that getStatusBar() returns the version from package.json
 * formatted as "Crystal ADM-CLI X.Y.Z".
 */
const { createAppState } = require('../../../src/tui/app-state');
const pkg = require('../../../package.json');

jest.mock('../../../src/config', () => ({
  readConfig: jest.fn(() => Promise.resolve({})),
  writeConfig: jest.fn(() => Promise.resolve()),
}));

describe('app-state — getStatusBar version', () => {
  let appState;

  beforeEach(() => {
    jest.clearAllMocks();
    appState = createAppState();
  });

  test('version contains package.json version', () => {
    const bar = appState.getStatusBar();
    expect(bar.version).toContain(pkg.version);
  });

  test('version is not hardcoded', () => {
    const bar = appState.getStatusBar();
    expect(bar.version).not.toBe('v0.2.0');
    expect(bar.version).not.toBe('0.2.0');
  });
});

describe('StatusBar renders "Crystal ADM-CLI <version>"', () => {
  test('status bar label is "Crystal ADM-CLI X.Y.Z"', () => {
    const appState = createAppState();
    const bar = appState.getStatusBar();
    expect(bar.version).toMatch(/^Crystal ADM-CLI \d+\.\d+\.\d+$/);
  });
});
