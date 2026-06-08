/**
 * TDD — /uninstall command: confirmation prompt
 *
 * Assumptions:
 * - dispatch('uninstall') returns { needsConfirm: true, confirmMessage, onConfirm, onCancel }
 * - It does NOT immediately uninstall — confirmation is required first
 * - onConfirm is an async function that performs the actual uninstall
 * - onCancel returns to normal input
 * - NOT tested: actual file removal (mocked), rendering, keyboard handling
 */
const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/uninstall — confirmation prompt', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({});
  });

  test('/uninstall returns needsConfirm: true', async () => {
    const result = await registry.dispatch('uninstall');
    expect(result.needsConfirm).toBe(true);
  });

  test('/uninstall includes a confirmation message mentioning removal', async () => {
    const result = await registry.dispatch('uninstall');
    expect(result.confirmMessage).toMatch(/remove/i);
  });

  test('/uninstall provides an async onConfirm callback', async () => {
    const result = await registry.dispatch('uninstall');
    expect(typeof result.onConfirm).toBe('function');
  });

  test('/uninstall provides an onCancel callback', async () => {
    const result = await registry.dispatch('uninstall');
    expect(typeof result.onCancel).toBe('function');
  });

  test('/uninstall does NOT set shouldExit immediately', async () => {
    const result = await registry.dispatch('uninstall');
    expect(result.shouldExit).toBe(false);
  });
});
