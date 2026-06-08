/**
 * TDD — /upgrade registered in BUILTIN_COMMANDS and dispatch
 *
 * Assumptions:
 * - 'upgrade' appears in BUILTIN_COMMANDS
 * - autocomplete returns 'upgrade' for partial 'up'
 * - dispatch('upgrade') calls the upgrade command
 * - NOT tested: actual upgrade logic (covered in upgrade.test.js)
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/upgrade — registration', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test("'upgrade' is in registered commands", () => {
    const names = [...registry.commands.keys()];
    expect(names).toContain('upgrade');
  });

  test('/upgrade autocomplete returns upgrade for partial "up"', () => {
    const matches = registry.autocomplete('up');
    expect(matches).toContain('upgrade');
  });

  test('/help includes upgrade command', async () => {
    const result = await registry.dispatch('help');
    expect(result.output).toMatch(/upgrade/);
  });

  test('/upgrade dispatch does not return unknown command', async () => {
    const result = await registry.dispatch('upgrade');
    expect(result.output).not.toMatch(/Unknown command/);
  });
});
