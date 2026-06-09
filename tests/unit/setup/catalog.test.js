const { loadCatalog, getToolsByCategories } = require('../../../src/setup/catalog');

describe('catalog', () => {
  describe('loadCatalog', () => {
    test('returns exactly 11 categories', () => {
      const categories = loadCatalog();
      expect(categories).toHaveLength(11);
    });

    test('each category has id, name, icon, and tools array', () => {
      const categories = loadCatalog();
      for (const cat of categories) {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('tools');
        expect(Array.isArray(cat.tools)).toBe(true);
      }
    });

    test('contains expected category IDs', () => {
      const categories = loadCatalog();
      const ids = categories.map(c => c.id).sort();
      expect(ids).toEqual([
        'artificial-intelligence', 'c-cpp', 'csharp-dotnet', 'go', 'java', 'js-ts',
        'php', 'python', 'ruby', 'rust', 'universal',
      ]);
    });

    test('catalog has at least 200 tools total', () => {
      const categories = loadCatalog();
      const total = categories.reduce((sum, cat) => sum + cat.tools.length, 0);
      expect(total).toBeGreaterThanOrEqual(200);
    });

    test('each tool has id, name, and installMethod', () => {
      const categories = loadCatalog();
      for (const cat of categories) {
        for (const tool of cat.tools) {
          expect(tool).toHaveProperty('id');
          expect(tool).toHaveProperty('name');
          expect(tool).toHaveProperty('installMethod');
        }
      }
    });
  });

  describe('getToolsByCategories', () => {
    test('returns tools only for selected category IDs', () => {
      const tools = getToolsByCategories(['js-ts']);
      for (const tool of tools) {
        expect(tool).toHaveProperty('id');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('installMethod');
      }
      expect(tools.length).toBeGreaterThan(0);
    });

    test('returns empty array for unknown category', () => {
      const tools = getToolsByCategories(['nonexistent']);
      expect(tools).toEqual([]);
    });

    test('returns tools from multiple categories', () => {
      const tools = getToolsByCategories(['js-ts', 'python']);
      expect(tools.length).toBeGreaterThan(0);
    });
  });
});
