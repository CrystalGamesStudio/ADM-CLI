const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/setup command', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/setup returns shouldShowSetup: true', async () => {
    const result = await registry.dispatch('setup');
    expect(result.shouldShowSetup).toBe(true);
  });

  test('/setup is listed in /help', async () => {
    const result = await registry.dispatch('help');
    expect(result.output).toContain('setup');
  });

  test('/setup --dry-run returns dry-run plan', async () => {
    const result = await registry.dispatch('setup --dry-run');
    expect(result.shouldShowSetup).toBe(true);
    expect(result.output).toContain('dry');
  });

  test('/setup appears in autocomplete', () => {
    const suggestions = registry.autocomplete('set');
    expect(suggestions).toContain('setup');
  });
});
