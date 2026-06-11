function createAutocomplete(getSuggestions, getCommandInfo) {
  return {
    visible: false,
    items: [],
    selectedIndex: 0,
    _getSuggestions: getSuggestions,
    _getCommandInfo: getCommandInfo,
  };
}

function updateAutocomplete(state, input) {
  if (!input.startsWith('/')) {
    state.visible = false;
    state.items = [];
    state.selectedIndex = 0;
    return;
  }

  const partial = input.slice(1);
  const names = state._getSuggestions(partial);
  const items = names.map(name => state._getCommandInfo(name)).filter(Boolean);
  state.visible = true;
  state.items = items;
  if (state.selectedIndex >= items.length) {
    state.selectedIndex = Math.max(0, items.length - 1);
  }
}

function moveUp(state) {
  if (!state.visible || state.items.length === 0) return;
  state.selectedIndex = (state.selectedIndex - 1 + state.items.length) % state.items.length;
}

function moveDown(state) {
  if (!state.visible || state.items.length === 0) return;
  state.selectedIndex = (state.selectedIndex + 1) % state.items.length;
}

function selectActive(state) {
  if (!state.visible || state.items.length === 0) return null;
  return '/' + state.items[state.selectedIndex].name;
}

function closeAutocomplete(state) {
  state.visible = false;
  state.items = [];
  state.selectedIndex = 0;
}

module.exports = {
  createAutocomplete,
  updateAutocomplete,
  moveUp,
  moveDown,
  selectActive,
  closeAutocomplete,
};
