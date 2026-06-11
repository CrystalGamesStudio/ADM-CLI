/**
 * TDD — Command Autocomplete Engine (Issue #21)
 *
 * Tests the autocomplete state module: createAutocomplete, updateAutocomplete,
 * moveUp, moveDown, selectActive, closeAutocomplete.
 */
const {
  createAutocomplete,
  updateAutocomplete,
  moveUp,
  moveDown,
  selectActive,
  closeAutocomplete,
} = require('../../../src/tui/autocomplete');

const COMMANDS = [
  { name: 'help', description: 'Show command reference' },
  { name: 'exit', description: 'Exit ADM' },
  { name: 'clear', description: 'Clear message history' },
  { name: 'theme', description: 'List or switch themes' },
  { name: 'github', description: 'GitHub operations' },
  { name: 'connect', description: 'Connect to GitHub or GitLab' },
];

function mockGetSuggestions(partial) {
  if (!partial) return COMMANDS.map(c => c.name);
  return COMMANDS.filter(c => c.name.startsWith(partial)).map(c => c.name);
}

function mockGetCommandInfo(name) {
  return COMMANDS.find(c => c.name === name) || null;
}

describe('Autocomplete — initialization', () => {
  test('createAutocomplete returns hidden state with empty items', () => {
    const ac = createAutocomplete(mockGetSuggestions, mockGetCommandInfo);
    expect(ac.visible).toBe(false);
    expect(ac.items).toEqual([]);
    expect(ac.selectedIndex).toBe(0);
  });
});

describe('Autocomplete — filtering', () => {
  let ac;

  beforeEach(() => {
    ac = createAutocomplete(mockGetSuggestions, mockGetCommandInfo);
  });

  test('"/" shows all commands with descriptions', () => {
    updateAutocomplete(ac, '/');
    expect(ac.visible).toBe(true);
    expect(ac.items.map(i => i.name)).toEqual(['help', 'exit', 'clear', 'theme', 'github', 'connect']);
    expect(ac.selectedIndex).toBe(0);
  });

  test('"/git" filters to matching commands', () => {
    updateAutocomplete(ac, '/git');
    expect(ac.visible).toBe(true);
    expect(ac.items.map(i => i.name)).toEqual(['github']);
  });

  test('"/c" filters to commands starting with "c"', () => {
    updateAutocomplete(ac, '/c');
    expect(ac.visible).toBe(true);
    expect(ac.items.map(i => i.name)).toEqual(['clear', 'connect']);
  });

  test('non-slash input keeps autocomplete hidden', () => {
    updateAutocomplete(ac, 'hello');
    expect(ac.visible).toBe(false);
    expect(ac.items).toEqual([]);
  });

  test('empty input keeps autocomplete hidden', () => {
    updateAutocomplete(ac, '');
    expect(ac.visible).toBe(false);
  });

  test('items include description for rendering', () => {
    updateAutocomplete(ac, '/');
    expect(ac.items[0]).toEqual({ name: 'help', description: 'Show command reference' });
  });
});

describe('Autocomplete — navigation', () => {
  let ac;

  beforeEach(() => {
    ac = createAutocomplete(mockGetSuggestions, mockGetCommandInfo);
    updateAutocomplete(ac, '/');
  });

  test('moveDown increments selectedIndex', () => {
    expect(ac.selectedIndex).toBe(0);
    moveDown(ac);
    expect(ac.selectedIndex).toBe(1);
  });

  test('moveUp decrements selectedIndex', () => {
    moveDown(ac);
    moveDown(ac);
    expect(ac.selectedIndex).toBe(2);
    moveUp(ac);
    expect(ac.selectedIndex).toBe(1);
  });

  test('moveDown wraps around to 0', () => {
    const lastIndex = ac.items.length - 1;
    ac.selectedIndex = lastIndex;
    moveDown(ac);
    expect(ac.selectedIndex).toBe(0);
  });

  test('moveUp wraps around to last item', () => {
    expect(ac.selectedIndex).toBe(0);
    moveUp(ac);
    expect(ac.selectedIndex).toBe(ac.items.length - 1);
  });

  test('navigation does nothing when autocomplete is hidden', () => {
    closeAutocomplete(ac);
    moveDown(ac);
    expect(ac.selectedIndex).toBe(0);
    moveUp(ac);
    expect(ac.selectedIndex).toBe(0);
  });
});

describe('Autocomplete — select and close', () => {
  let ac;

  beforeEach(() => {
    ac = createAutocomplete(mockGetSuggestions, mockGetCommandInfo);
    updateAutocomplete(ac, '/');
  });

  test('selectActive returns command name with slash prefix', () => {
    ac.selectedIndex = 0;
    expect(selectActive(ac)).toBe('/help');
  });

  test('selectActive returns second item', () => {
    moveDown(ac);
    expect(selectActive(ac)).toBe('/exit');
  });

  test('selectActive returns null when hidden', () => {
    closeAutocomplete(ac);
    expect(selectActive(ac)).toBeNull();
  });

  test('selectActive returns null when no items match', () => {
    updateAutocomplete(ac, '/zzz');
    expect(selectActive(ac)).toBeNull();
  });

  test('closeAutocomplete resets all state', () => {
    moveDown(ac);
    closeAutocomplete(ac);
    expect(ac.visible).toBe(false);
    expect(ac.items).toEqual([]);
    expect(ac.selectedIndex).toBe(0);
  });
});
