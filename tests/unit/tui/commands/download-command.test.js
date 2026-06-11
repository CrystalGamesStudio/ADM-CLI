const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/download command', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/download returns shouldShowSetup: true', async () => {
    const result = await registry.dispatch('download');
    expect(result.shouldShowSetup).toBe(true);
  });

  test('/download --dry-run returns dry-run plan', async () => {
    const result = await registry.dispatch('download --dry-run');
    expect(result.shouldShowSetup).toBe(true);
    expect(result.output).toContain('dry');
  });

  test('/download is listed in /help', async () => {
    const result = await registry.dispatch('help');
    expect(result.output).toContain('download');
  });

  test('/download appears in autocomplete', () => {
    const suggestions = registry.autocomplete('dow');
    expect(suggestions).toContain('download');
  });
});

describe('/setup removal', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/setup is unknown command', async () => {
    const result = await registry.dispatch('setup');
    expect(result.output).toContain('Unknown command');
  });

  test('/setup does NOT appear in autocomplete', () => {
    const suggestions = registry.autocomplete('set');
    expect(suggestions).not.toContain('setup');
  });
});
