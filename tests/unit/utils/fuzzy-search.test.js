const { matchCommands } = require('../../../src/utils/fuzzy-search');

describe('fuzzy search', () => {
  const commands = [
    { name: 'help' },
    { name: 'exit' },
    { name: 'ai' },
    { name: 'status' },
    { name: 'pr' },
    { name: 'commit' },
    { name: 'open' },
    { name: 'app' },
  ];

  test('exact prefix match returns matching commands', () => {
    const results = matchCommands('pr', commands);
    expect(results).toEqual([{ name: 'pr' }]);
  });

  test('partial match returns multiple candidates', () => {
    const results = matchCommands('a', commands);
    expect(results.length).toBe(2);
    expect(results.map(r => r.name)).toEqual(expect.arrayContaining(['ai', 'app']));
  });

  test('empty query returns all commands', () => {
    const results = matchCommands('', commands);
    expect(results.length).toBe(commands.length);
  });

  test('no match returns empty array', () => {
    const results = matchCommands('xyz', commands);
    expect(results).toEqual([]);
  });

  test('fuzzy match works for substring', () => {
    const results = matchCommands('tat', commands);
    expect(results).toEqual([{ name: 'status' }]);
  });
});
