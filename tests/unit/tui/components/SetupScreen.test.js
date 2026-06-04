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

  test('initial state has 10 categories loaded', () => {
    const { createSetupState } = require('../../../../src/tui/components/SetupScreen');
    const state = createSetupState();
    expect(state.categories).toHaveLength(10);
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
