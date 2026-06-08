/**
 * TDD — AI mode: app-state toggle behavior + AI queries
 *
 * Assumptions:
 * - Input: processInput(string) as before
 * - When registry returns shouldToggleAI, app-state toggles aiMode
 * - getStatusBar() reflects current aiMode
 * - aiMode starts as false
 * - In AI mode, processInput sends text to AI backend (mocked at fetch boundary)
 * - AI response appears with "GLM:" prefix
 * - NOT tested: knowledge system, rendering, streaming
 */
const { createAppState } = require('../../../src/tui/app-state');
const { createClient } = require('../../../src/integrations/ai-backend');

describe('AI mode — app-state toggle', () => {
  let appState;

  beforeEach(() => {
    appState = createAppState();
  });

  test('aiMode starts as false', () => {
    expect(appState.getStatusBar().aiMode).toBe(false);
  });

  test('/ai toggles aiMode ON', async () => {
    await appState.processInput('ai');
    expect(appState.getStatusBar().aiMode).toBe(true);
  });

  test('/ai twice toggles aiMode back OFF', async () => {
    await appState.processInput('ai');
    await appState.processInput('ai');
    expect(appState.getStatusBar().aiMode).toBe(false);
  });

  test('toggling AI mode adds a message', async () => {
    await appState.processInput('ai');
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/AI.*ON/i);
  });

  test('/exit in AI mode exits AI mode without quitting app', async () => {
    await appState.processInput('ai');
    expect(appState.getStatusBar().aiMode).toBe(true);
    await appState.processInput('exit');
    expect(appState.getStatusBar().aiMode).toBe(false);
  });

  test('/exit in AI mode does NOT set shouldExit', async () => {
    await appState.processInput('ai');
    const result = await appState.processInput('exit');
    expect(result.shouldExit).toBe(false);
  });

  test('exitAI() method explicitly exits AI mode', () => {
    appState.exitAI();
    expect(appState.getStatusBar().aiMode).toBe(false);
  });
});

describe('AI mode — queries', () => {
  let appState;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({ aiProvider: 'glm', 'ai.glmKey': 'test-key' })),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    jest.doMock('../../../src/integrations/ai-providers/registry', () => ({
      queryWithProvider: jest.fn(() => Promise.resolve('Git is a version control system.')),
      getProvider: jest.fn(() => ({ id: 'glm', name: 'GLM', requiresAuth: false })),
      listProviders: jest.fn(() => []),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('in AI mode, input is sent to active provider', async () => {
    const { createAppState: createState } = require('../../../src/tui/app-state');
    const { queryWithProvider } = require('../../../src/integrations/ai-providers/registry');

    appState = createState();
    await appState.processInput('ai'); // toggle ON
    await appState.processInput('what is git?');

    expect(queryWithProvider).toHaveBeenCalledWith(
      'glm',
      'what is git?',
      expect.objectContaining({ apiKey: 'test-key', messages: expect.any(Array) }),
    );
  });

  test('AI response appears in messages with GLM: prefix', async () => {
    const { createAppState: createState } = require('../../../src/tui/app-state');

    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/GLM:/);
    expect(last.text).toMatch(/version control/);
    expect(last.type).toBe('ai');
  });

  test('in AI mode, input is NOT dispatched to command registry', async () => {
    const { createAppState: createState } = require('../../../src/tui/app-state');
    const { queryWithProvider } = require('../../../src/integrations/ai-providers/registry');

    appState = createState();
    await appState.processInput('ai'); // toggle ON
    // 'help' would normally go to registry — in AI mode it should go to AI instead
    await appState.processInput('help');

    expect(queryWithProvider).toHaveBeenCalled();
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.type).toBe('ai');
  });

  test('after exiting AI mode, input goes back to registry', async () => {
    const { createAppState: createState } = require('../../../src/tui/app-state');

    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('exit');

    const result = await appState.processInput('help');
    expect(result.output).toMatch(/Available commands/);
  });

  test('AI query failure shows friendly error in messages', async () => {
    jest.resetModules();
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({ aiProvider: 'glm', 'ai.glmKey': 'test-key' })),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    jest.doMock('../../../src/integrations/ai-providers/registry', () => ({
      queryWithProvider: jest.fn(() => Promise.reject(new Error('Network timeout'))),
      getProvider: jest.fn(() => ({ id: 'glm', name: 'GLM', requiresAuth: false })),
      listProviders: jest.fn(() => []),
    }));

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/error/i);
    expect(last.type).toBe('ai-error');
  });

  test('AI query failure does not exit AI mode', async () => {
    jest.resetModules();
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({ aiProvider: 'glm', 'ai.glmKey': 'test-key' })),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    jest.doMock('../../../src/integrations/ai-providers/registry', () => ({
      queryWithProvider: jest.fn(() => Promise.reject(new Error('Network timeout'))),
      getProvider: jest.fn(() => ({ id: 'glm', name: 'GLM', requiresAuth: false })),
      listProviders: jest.fn(() => []),
    }));

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    expect(appState.getStatusBar().aiMode).toBe(true);
  });
});

describe('AI mode — knowledge injection', () => {
  let appState;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('AI query includes knowledge as system message in messages', async () => {
    jest.doMock('../../../src/ai/knowledge', () => ({
      getKnowledge: jest.fn().mockReturnValue('ADM is a developer CLI tool.'),
    }));
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({ aiProvider: 'glm', 'ai.glmKey': 'test-key' })),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    const mockQueryWithProvider = jest.fn(() => Promise.resolve('ADM helps devs.'));
    jest.doMock('../../../src/integrations/ai-providers/registry', () => ({
      queryWithProvider: mockQueryWithProvider,
      getProvider: jest.fn(() => ({ id: 'glm', name: 'GLM', requiresAuth: false })),
      listProviders: jest.fn(() => []),
    }));

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('what is adm?');

    const callArgs = mockQueryWithProvider.mock.calls[0];
    const messages = callArgs[2].messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('ADM is a developer CLI tool');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('what is adm?');
  });

  test('AI query works without knowledge (graceful degradation)', async () => {
    jest.doMock('../../../src/ai/knowledge', () => ({
      getKnowledge: jest.fn().mockReturnValue(null),
    }));
    jest.doMock('../../../src/config', () => ({
      readConfig: jest.fn(() => Promise.resolve({ aiProvider: 'glm', 'ai.glmKey': 'test-key' })),
      writeConfig: jest.fn(() => Promise.resolve()),
    }));
    const mockQueryWithProvider = jest.fn(() => Promise.resolve('ok'));
    jest.doMock('../../../src/integrations/ai-providers/registry', () => ({
      queryWithProvider: mockQueryWithProvider,
      getProvider: jest.fn(() => ({ id: 'glm', name: 'GLM', requiresAuth: false })),
      listProviders: jest.fn(() => []),
    }));

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('hello');

    const callArgs = mockQueryWithProvider.mock.calls[0];
    const messages = callArgs[2].messages;
    // No system message when knowledge is null
    expect(messages.length).toBe(1);
    expect(messages[0].role).toBe('user');
  });
});
