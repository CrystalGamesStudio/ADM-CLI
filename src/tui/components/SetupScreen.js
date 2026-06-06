const React = require('react');
const { loadCatalog, getToolsByCategories } = require('../../setup/catalog');
const { installTools, installToolAsync, getInstallCommand, isToolInstalled } = require('../../setup/installer');

const PAGE_SIZE = 10;

function createSetupState(opts = {}) {
  const categories = loadCatalog();
  const onExit = opts.onExit || (() => {});
  const dryRun = opts.dryRun || false;
  const execSync = opts.execSync;

  const state = {
    categories,
    step: 'categories',
    selectedCategories: [],
    selectedTools: [],
    summary: null,
    cursor: 0,
    page: 0,
    installProgress: null,

    toggleCategory(id) {
      const idx = state.selectedCategories.indexOf(id);
      if (idx === -1) state.selectedCategories.push(id);
      else state.selectedCategories.splice(idx, 1);
    },

    toggleTool(id) {
      const idx = state.selectedTools.indexOf(id);
      if (idx === -1) state.selectedTools.push(id);
      else state.selectedTools.splice(idx, 1);
    },

    getToolsForSelectedCategories() {
      return getToolsByCategories(state.selectedCategories);
    },

    goToTools() {
      state.step = 'tools';
      state.cursor = 0;
      state.page = 0;
    },

    goToInstall() {
      state.step = 'install';
      state.cursor = 0;
      state.page = 0;
    },

    goToSummary(summary, results) {
      state.summary = summary;
      state.installResults = results || [];
      state.step = 'summary';
      state.page = 0;
    },

    getVisibleItems() {
      if (state.step === 'categories') return state.categories;
      if (state.step === 'tools') return state.getToolsForSelectedCategories();
      if (state.step === 'summary') return state.installResults || [];
      return [];
    },

    handleArrow(direction) {
      const totalPages = state.getTotalPages();
      if (direction === 'right' && state.page < totalPages - 1) {
        state.page++;
      } else if (direction === 'left' && state.page > 0) {
        state.page--;
      }
    },

    getTotalPages() {
      return Math.max(1, Math.ceil(state.getVisibleItems().length / PAGE_SIZE));
    },

    cancel() {
      onExit();
    },

    async runInstall(platform, onProgress) {
      if (dryRun) {
        const allTools = state.getToolsForSelectedCategories();
        const selected = allTools.filter(t => state.selectedTools.includes(t.id));
        const plan = selected.map(t => ({
          id: t.id,
          name: t.name,
          command: getInstallCommand(t, platform),
        }));
        return { dryRun: true, plan };
      }

      const allTools = state.getToolsForSelectedCategories();
      const selected = allTools.filter(t => state.selectedTools.includes(t.id));
      const results = [];

      for (const tool of selected) {
        state.installProgress = { current: tool.name, done: results.length, total: selected.length };
        if (onProgress) onProgress();

        const result = await installToolAsync(tool, platform);
        results.push(result);
        if (onProgress) onProgress();
      }

      state.installProgress = null;

      const summary = {
        installed: results.filter(r => r.status === 'installed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: results.filter(r => r.status === 'failed').length,
      };

      return { results, summary };
    },
  };

  return state;
}

function createSetupScreen(ink) {
  const { Box, Text, useInput, useApp } = ink;

  return function SetupScreen({ onExit, dryRun, platform }) {
    const stateRef = React.useRef(createSetupState({ onExit, dryRun }));
    const [renderKey, setRenderKey] = React.useState(0);
    const s = stateRef.current;

    const triggerRender = () => setRenderKey(k => k + 1);

    const allItems = s.getVisibleItems();

    const totalPages = s.getTotalPages();
    const pageStart = s.page * PAGE_SIZE;
    const pageItems = allItems.slice(pageStart, pageStart + PAGE_SIZE);

    // Clamp cursor to current page
    if (s.cursor < pageStart || s.cursor >= pageStart + pageItems.length) {
      s.cursor = pageStart;
    }

    useInput((ch, key) => {
      if (key.escape) {
        s.cancel();
        return;
      }

      // Navigate up/down within current page
      if (key.upArrow) {
        s.cursor = Math.max(pageStart, s.cursor - 1);
        triggerRender();
        return;
      }
      if (key.downArrow) {
        s.cursor = Math.min(pageStart + pageItems.length - 1, s.cursor + 1);
        triggerRender();
        return;
      }

      // Page left/right
      if (key.leftArrow) {
        s.handleArrow('left');
        s.cursor = s.page * PAGE_SIZE;
        triggerRender();
        return;
      }
      if (key.rightArrow) {
        s.handleArrow('right');
        s.cursor = s.page * PAGE_SIZE;
        triggerRender();
        return;
      }

      // Space — toggle selection
      if (ch === ' ') {
        const item = allItems[s.cursor];
        if (!item) return;
        if (s.step === 'categories') {
          s.toggleCategory(item.id);
        } else if (s.step === 'tools') {
          s.toggleTool(item.id);
        }
        triggerRender();
        return;
      }

      // Enter — confirm step
      if (key.return) {
        if (s.step === 'categories' && s.selectedCategories.length > 0) {
          s.goToTools();
          triggerRender();
        } else if (s.step === 'tools' && s.selectedTools.length > 0) {
          s.goToInstall();
          triggerRender();
          s.runInstall(platform || 'darwin', triggerRender).then(result => {
            if (result.summary) {
              s.goToSummary(result.summary, result.results || []);
            }
            triggerRender();
          });
        }
      }
    });

    const lines = [];
    const selCount = s.step === 'categories' ? s.selectedCategories.length : s.selectedTools.length;
    const pagerText = totalPages > 1 ? `  [${s.page + 1}/${totalPages}]  ←→ = change page` : '';

    if (s.step === 'categories') {
      lines.push({ text: `Select categories (${selCount} selected) Space=toggle  Enter=confirm  Esc=cancel`, highlight: false });
      lines.push({ text: pagerText, highlight: false });

      for (let i = 0; i < pageItems.length; i++) {
        const cat = pageItems[i];
        const globalIdx = pageStart + i;
        const marker = s.selectedCategories.includes(cat.id) ? '[x]' : '[ ]';
        const active = globalIdx === s.cursor ? ' > ' : '   ';
        lines.push({ text: `${active}${marker} ${cat.icon} ${cat.name}`, highlight: globalIdx === s.cursor });
      }
    } else if (s.step === 'tools') {
      lines.push({ text: `Select tools (${selCount} selected) Space=toggle  Enter=confirm  Esc=cancel`, highlight: false });
      lines.push({ text: pagerText, highlight: false });

      for (let i = 0; i < pageItems.length; i++) {
        const tool = pageItems[i];
        const globalIdx = pageStart + i;
        const marker = s.selectedTools.includes(tool.id) ? '[x]' : '[ ]';
        const active = globalIdx === s.cursor ? ' > ' : '   ';
        lines.push({ text: `${active}${marker} ${tool.name} (${tool.installMethod})`, highlight: globalIdx === s.cursor });
      }
    } else if (s.step === 'install') {
      const p = s.installProgress;
      if (p) {
        lines.push({ text: `Installing (${p.done + 1}/${p.total}): ${p.current}...`, highlight: false });
      } else {
        lines.push({ text: 'Installing selected tools...', highlight: false });
      }
    } else if (s.step === 'summary') {
      const sum = s.summary || {};
      const results = s.installResults || [];

      lines.push({ text: ' Setup complete!', highlight: false });
      lines.push({ text: ` Installed: ${sum.installed || 0}  Skipped: ${sum.skipped || 0}  Failed: ${sum.failed || 0}`, highlight: false });
      lines.push({ text: '', highlight: false });

      // Show per-tool results (paginated)
      const resPageStart = s.page * PAGE_SIZE;
      const resPage = results.slice(resPageStart, resPageStart + PAGE_SIZE);
      const resTotalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

      for (const r of resPage) {
        const icon = r.status === 'installed' ? '+' : r.status === 'skipped' ? '-' : 'x';
        const color = r.status === 'installed' ? 'green' : r.status === 'skipped' ? 'yellow' : 'red';
        const detail = r.status === 'failed' ? ` — ${r.error || 'unknown error'}` : '';
        lines.push({ text: `  [${icon}] ${r.name} ${r.status}${detail}`, color, highlight: false });
        if (r.hint) {
          lines.push({ text: `       ${r.hint}`, color: 'gray', highlight: false });
        }
      }

      if (resTotalPages > 1) {
        lines.push({ text: `  [${s.page + 1}/${resTotalPages}] ←→ = more results`, highlight: false });
      }

      lines.push({ text: '\n Press Esc to return to ADM.', highlight: false });

      if (sum.installed > 0) {
        lines.push({ text: ' Tip: restart terminal (or run: source ~/.zshrc) for new tools', color: 'yellow', highlight: false });
      }

      if (dryRun) {
        lines.push({ text: ' (dry-run mode — no tools were actually installed)', highlight: false });
      }
    }

    return React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, paddingX: 1 },
      ...lines.map((line, i) =>
        React.createElement(Text, {
          key: i,
          wrap: 'wrap',
          color: line.color || (line.highlight ? 'cyan' : undefined),
          bold: line.highlight,
        }, line.text)
      ),
    );
  };
}

module.exports = { createSetupScreen, createSetupState };
