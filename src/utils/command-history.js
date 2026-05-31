const fs = require('fs').promises;
const path = require('path');
const { configDir } = require('../config/index');

const MAX_ENTRIES = 1000;

function historyFile() {
  return path.join(configDir(), 'history');
}

async function loadHistory() {
  try {
    const data = await fs.readFile(historyFile(), 'utf8');
    return data.split('\n').filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveCommand(command) {
  const trimmed = command.trim();
  if (!trimmed) return;

  const dir = configDir();
  await fs.mkdir(dir, { recursive: true });

  let history = await loadHistory();
  history.push(trimmed);
  if (history.length > MAX_ENTRIES) {
    history = history.slice(history.length - MAX_ENTRIES);
  }

  await fs.writeFile(historyFile(), history.join('\n'), 'utf8');
}

async function searchHistory(query) {
  const history = await loadHistory();
  const lower = query.toLowerCase();
  return history.filter(entry => entry.toLowerCase().includes(lower));
}

module.exports = { saveCommand, loadHistory, searchHistory };
