const { createDispatcher } = require('../../../src/repl/shell');

describe('REPL dispatch', () => {
  let dispatch;

  beforeEach(() => {
    ({ dispatch } = createDispatcher({}));
  });

  test('help returns command reference with all registered commands', async () => {
    const result = await dispatch('help');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/help/);
    expect(result.output).toMatch(/exit/);
    expect(result.output).toMatch(/ai/);
    expect(result.output).toMatch(/status/);
    expect(result.output).toMatch(/pr/);
    expect(result.output).toMatch(/commit/);
    expect(result.output).toMatch(/open/);
    expect(result.output).toMatch(/app/);
  });

  test('exit signals the shell should stop', async () => {
    const result = await dispatch('exit');
    expect(result.shouldExit).toBe(true);
  });

  test('unknown command returns error message', async () => {
    const result = await dispatch('foobar');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/Unknown command/);
  });

  test('empty input returns nothing', async () => {
    const result = await dispatch('');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toBe('');
  });

  test('whitespace-only input returns nothing', async () => {
    const result = await dispatch('   ');
    expect(result.shouldExit).toBe(false);
    expect(result.output).toBe('');
  });
});
