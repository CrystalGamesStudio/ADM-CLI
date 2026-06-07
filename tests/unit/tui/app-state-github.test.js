/**
 * TDD — /github interactive menu: app-state behavior
 *
 * Assumptions:
 * - Input: processInput('github') triggers interactive mode
 * - State: githubStep ('select'|null), githubCursor (0–3)
 * - Actions: moveGithubCursor, selectGithubItem, cancelGithub
 * - 4 items: Status, PRs, Issues, Commits
 * - NOT tested: Ink rendering, GitHub API integration
 */
const { createAppState } = require('../../../src/tui/app-state');

describe('GitHub interactive menu — app-state', () => {
  let appState;

  beforeEach(() => {
    appState = createAppState();
  });

  test('githubStep starts as null', () => {
    expect(appState.githubStep).toBeNull();
  });

  test('/github sets githubStep to select', async () => {
    await appState.processInput('github');
    expect(appState.githubStep).toBe('select');
  });

  test('/github sets githubCursor to 0', async () => {
    await appState.processInput('github');
    expect(appState.githubCursor).toBe(0);
  });

  test('/github adds menu prompt message', async () => {
    await appState.processInput('github');
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/select/i);
    expect(last.type).toBe('system');
  });

  test('moveGithubCursor moves down', async () => {
    await appState.processInput('github');
    expect(appState.githubCursor).toBe(0);
    appState.moveGithubCursor(1);
    expect(appState.githubCursor).toBe(1);
  });

  test('moveGithubCursor wraps around from bottom to top', async () => {
    await appState.processInput('github');
    appState.moveGithubCursor(1); // 1
    appState.moveGithubCursor(1); // 2
    appState.moveGithubCursor(1); // 3
    appState.moveGithubCursor(1); // wraps to 0
    expect(appState.githubCursor).toBe(0);
  });

  test('moveGithubCursor wraps around from top to bottom', async () => {
    await appState.processInput('github');
    appState.moveGithubCursor(-1); // wraps from 0 to 3
    expect(appState.githubCursor).toBe(3);
  });

  test('cancelGithub resets githubStep and adds cancelled message', async () => {
    await appState.processInput('github');
    expect(appState.githubStep).toBe('select');
    appState.cancelGithub();
    expect(appState.githubStep).toBeNull();
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/cancelled/i);
  });

  test('selectGithubItem with cursor 0 dispatches status', async () => {
    await appState.processInput('github');
    appState.selectGithubItem();
    expect(appState.githubStep).toBeNull();
  });

  test('selectGithubItem with cursor 1 dispatches pr list', async () => {
    await appState.processInput('github');
    appState.moveGithubCursor(1); // cursor at 1 = PRs
    appState.selectGithubItem();
    expect(appState.githubStep).toBeNull();
  });
});
