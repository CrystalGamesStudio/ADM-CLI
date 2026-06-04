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
  let originalFetch;

  beforeEach(() => {
    process.env.GLM_API_KEY = 'test-key-for-ai-mode';
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GLM_API_KEY;
  });

  test('in AI mode, input is sent to GLM API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Git is a version control system.' } }],
      }),
    });

    appState = createAppState();
    await appState.processInput('ai'); // toggle ON
    await appState.processInput('what is git?');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('AI response appears in messages with GLM: prefix', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Git is a version control system.' } }],
      }),
    });

    appState = createAppState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/GLM:/);
    expect(last.text).toMatch(/version control/);
    expect(last.type).toBe('ai');
  });

  test('in AI mode, input is NOT dispatched to command registry', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'ok' } }],
      }),
    });

    appState = createAppState();
    await appState.processInput('ai'); // toggle ON
    // 'help' would normally go to registry — in AI mode it should go to AI instead
    await appState.processInput('help');

    expect(global.fetch).toHaveBeenCalled();
    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.type).toBe('ai');
  });

  test('after exiting AI mode, input goes back to registry', async () => {
    appState = createAppState();
    await appState.processInput('ai');
    await appState.processInput('exit');

    const result = await appState.processInput('help');
    expect(result.output).toMatch(/Available commands/);
  });

  test('AI query failure shows friendly error in messages', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

    appState = createAppState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    const msgs = appState.messages;
    const last = msgs[msgs.length - 1];
    expect(last.text).toMatch(/error/i);
    expect(last.type).toBe('ai-error');
  });

  test('AI query failure does not exit AI mode', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

    appState = createAppState();
    await appState.processInput('ai');
    await appState.processInput('what is git?');

    expect(appState.getStatusBar().aiMode).toBe(true);
  });
});

describe('AI mode — knowledge injection', () => {
  let appState;
  let originalFetch;

  beforeEach(() => {
    process.env.GLM_API_KEY = 'test-key-for-knowledge';
    originalFetch = global.fetch;
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GLM_API_KEY;
  });

  test('AI query includes knowledge as system message in API call', async () => {
    jest.doMock('../../../src/ai/knowledge', () => ({
      getKnowledge: jest.fn().mockReturnValue('ADM is a developer CLI tool.'),
    }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'ADM helps devs.' } }],
      }),
    });

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('what is adm?');

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.messages[0].role).toBe('system');
    expect(callBody.messages[0].content).toContain('ADM is a developer CLI tool');
    expect(callBody.messages[1].role).toBe('user');
    expect(callBody.messages[1].content).toBe('what is adm?');
  });

  test('AI query works without knowledge (graceful degradation)', async () => {
    jest.doMock('../../../src/ai/knowledge', () => ({
      getKnowledge: jest.fn().mockReturnValue(null),
    }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'ok' } }],
      }),
    });

    const { createAppState: createState } = require('../../../src/tui/app-state');
    appState = createState();
    await appState.processInput('ai');
    await appState.processInput('hello');

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    // No system message when knowledge is null
    expect(callBody.messages.length).toBe(1);
    expect(callBody.messages[0].role).toBe('user');
  });
});
