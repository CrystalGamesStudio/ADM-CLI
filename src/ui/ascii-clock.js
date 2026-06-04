const DIGITS = {
  '0': [' █████ ', '██   ██', '██   ██', '██   ██', ' █████ '],
  '1': ['   ██  ', ' ████  ', '   ██  ', '   ██  ', ' ████  '],
  '2': [' █████ ', '██   ██', '    ██ ', '  ██   ', '███████'],
  '3': ['███████', '    ██ ', '  ████ ', '    ██ ', '███████'],
  '4': ['██   ██', '██   ██', '███████', '     ██', '     ██'],
  '5': ['███████', '██     ', '███████', '     ██', '███████'],
  '6': [' █████ ', '██     ', '███████', '██   ██', ' █████ '],
  '7': ['███████', '    ██ ', '   ██  ', '  ██   ', '  ██   '],
  '8': [' █████ ', '██   ██', ' █████ ', '██   ██', ' █████ '],
  '9': [' █████ ', '██   ██', ' ██████', '     ██', ' █████ '],
};
const COLON = ['       ', '   █   ', '       ', '   █   ', '       '];

function pad(arr, width) {
  return arr.map(line => line.padEnd(width));
}

function renderClock(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const chars = [h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]];

  const rows = [[], [], [], [], []];
  for (const ch of chars) {
    const glyph = ch === ':' ? COLON : DIGITS[ch];
    for (let r = 0; r < 5; r++) {
      rows[r].push(glyph[r]);
    }
  }

  const lines = rows.map(row => row.join(' '));
  const maxLen = Math.max(...lines.map(l => l.length));
  return pad(lines, maxLen);
}

module.exports = { renderClock };
