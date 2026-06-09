const React = require('react');
const { createSetupScreen } = require('../../../../src/tui/components/SetupScreen');

describe('SetupScreen', () => {
  const mockExit = jest.fn();
  const mockUseInput = jest.fn();
  const inkMock = {
    Box: 'box',
    Text: 'text',
    useInput: mockUseInput,
    useApp: () => ({ exit: mockExit }),
  };

  test('createSetupScreen returns a function component', () => {
    const SetupScreen = createSetupScreen(inkMock);
    expect(typeof SetupScreen).toBe('function');
  });

  test('initial state has 11 categories loaded', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    expect(state.categories).toHaveLength(11);
    expect(state.step).toBe('categories');
    expect(state.selectedCategories).toEqual([]);
    expect(state.selectedTools).toEqual([]);
  });

  test('toggleCategory adds and removes category IDs', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    state.toggleCategory('js-ts');
    expect(state.selectedCategories).toContain('js-ts');
    state.toggleCategory('js-ts');
    expect(state.selectedCategories).not.toContain('js-ts');
  });

  test('toggleTool adds and removes tool IDs', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    state.toggleTool('vite');
    expect(state.selectedTools).toContain('vite');
    state.toggleTool('vite');
    expect(state.selectedTools).not.toContain('vite');
  });

  test('getToolsForSelectedCategories returns tools only for selected', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    state.toggleCategory('js-ts');
    const tools = state.getToolsForSelectedCategories();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every(t => t.id)).toBe(true);
  });

  test('steps progress: categories → tools → install → summary', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    expect(state.step).toBe('categories');
    state.goToTools();
    expect(state.step).toBe('tools');
    state.goToInstall();
    expect(state.step).toBe('install');
    state.goToSummary({ installed: 5, skipped: 2, failed: 1 });
    expect(state.step).toBe('summary');
    expect(state.summary).toEqual({ installed: 5, skipped: 2, failed: 1 });
  });

  test('Esc returns to main view via callback', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const onExit = jest.fn();
    const state = createSetupState({ onExit });
    state.cancel();
    expect(onExit).toHaveBeenCalled();
  });

  test('dryRun mode does not execute commands', async () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const execSync = jest.fn();
    const state = createSetupState({ dryRun: true, execSync });
    state.toggleCategory('js-ts');
    state.goToTools();
    state.toggleTool('vite');
    state.goToInstall();
    const result = await state.runInstall('darwin');
    expect(execSync).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ dryRun: true }));
  });

  test('summary step: getVisibleItems returns install results for pagination', () => {
    // Assumptions:
    // - installResults is an array of { name, status } objects
    // - PAGE_SIZE = 10, so 15 results = 2 pages
    // - getVisibleItems() on state returns the items for the current step
    // NOT tested: visual rendering, useInput wiring, install flow, categories/tools steps
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const results = Array.from({ length: 15 }, (_, i) => ({
      name: `tool-${i}`,
      status: 'installed',
    }));

    const state = createSetupState({ onExit: jest.fn() });
    state.goToSummary({ installed: 15, skipped: 0, failed: 0 }, results);

    const items = state.getVisibleItems();
    expect(items).toHaveLength(15);
  });

  test('summary step: right arrow paginates forward, left arrow paginates back', () => {
    // Assumptions:
    // - PAGE_SIZE = 10, 15 results = 2 pages
    // - handleArrow('right') / handleArrow('left') change page state
    // - Clamped: can't go below page 0 or above last page
    // NOT tested: visual rendering, categories/tools steps
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const results = Array.from({ length: 15 }, (_, i) => ({
      name: `tool-${i}`,
      status: 'installed',
    }));

    const state = createSetupState({ onExit: jest.fn() });
    state.goToSummary({ installed: 15, skipped: 0, failed: 0 }, results);
    expect(state.page).toBe(0);

    // Right arrow → page 1
    state.handleArrow('right');
    expect(state.page).toBe(1);

    // Right arrow again → clamped (already on last page)
    state.handleArrow('right');
    expect(state.page).toBe(1);

    // Left arrow → page 0
    state.handleArrow('left');
    expect(state.page).toBe(0);

    // Left arrow again → clamped (already on first page)
    state.handleArrow('left');
    expect(state.page).toBe(0);
  });

  test('summary step: getTotalPages computes correct page count', () => {
    // Assumptions:
    // - PAGE_SIZE = 10
    // - 25 results → 3 pages, 10 results → 1 page, 0 results → 1 page (Math.max)
    // NOT tested: visual rendering
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');

    // 25 results → 3 pages
    const results25 = Array.from({ length: 25 }, (_, i) => ({ name: `t-${i}`, status: 'installed' }));
    const state25 = createSetupState({ onExit: jest.fn() });
    state25.goToSummary({ installed: 25, skipped: 0, failed: 0 }, results25);
    expect(state25.getTotalPages()).toBe(3);

    // Exactly 10 results → 1 page
    const results10 = Array.from({ length: 10 }, (_, i) => ({ name: `t-${i}`, status: 'installed' }));
    const state10 = createSetupState({ onExit: jest.fn() });
    state10.goToSummary({ installed: 10, skipped: 0, failed: 0 }, results10);
    expect(state10.getTotalPages()).toBe(1);

    // 0 results → 1 page (Math.max floor)
    const state0 = createSetupState({ onExit: jest.fn() });
    state0.goToSummary({ installed: 0, skipped: 0, failed: 0 }, []);
    expect(state0.getTotalPages()).toBe(1);
  });

  test('install mode calls installer for selected tools', async () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState({});
    state.toggleCategory('js-ts');
    state.goToTools();
    state.toggleTool('vite');
    state.goToInstall();
    const result = await state.runInstall('darwin');
    expect(result.results).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
  });
});
