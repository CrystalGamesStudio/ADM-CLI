const { createRegistry } = require('../../../../src/tui/commands/registry');

const FEEDBACK_URL = 'https://crystalgames.studio/#/contact';

describe('/feedback command', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/feedback returns needsConfirm with prompt message', async () => {
    const result = await registry.dispatch('feedback');
    expect(result.needsConfirm).toBe(true);
    expect(result.output).toMatch(/otworz/i);
    expect(result.output).toMatch(/Y\/n/);
  });

  test('/feedback confirm callback opens browser URL', async () => {
    const result = await registry.dispatch('feedback');
    const opened = { url: null };
    await result.onConfirm({ openUrl: (url) => { opened.url = url; } });
    expect(opened.url).toBe(FEEDBACK_URL);
  });

  test('/feedback cancel callback does not open browser', async () => {
    const result = await registry.dispatch('feedback');
    const cancelResult = result.onCancel({ openUrl: () => { throw new Error('should not open'); } });
    expect(cancelResult.output).toMatch(/cancel/i);
  });

  test('/feedback appears in autocomplete', () => {
    const suggestions = registry.autocomplete('fee');
    expect(suggestions).toContain('feedback');
  });

  test('/feedback is listed in /help', async () => {
    const result = await registry.dispatch('help');
    expect(result.output).toContain('feedback');
  });
});
