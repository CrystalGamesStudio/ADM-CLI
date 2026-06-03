const { renderClock } = require('../ui/ascii-clock');
const { resolveTheme } = require('../ui/theme');

// ── ANSI color (no chalk at runtime = less data per write) ─
function hexToAnsi(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1B[38;2;${r};${g};${b}m`;
}
const RST = '\x1B[0m';

// ── Glyph layout (H H : M M : S S) ────────────────────────
const GW = [7, 7, 3, 7, 7, 3, 7, 7];
const GP = [];
{ let p = 0; for (const w of GW) { GP.push(p); p += w + 1; } }

/**
 * Full-screen ASCII clock — flicker-free.
 * • Draw once at start.
 * • Each second: only the single changed digit gets overwritten.
 * • No console.clear(), no full repaint, no SYNC codes.
 */
function startClock(config = {}) {
  const theme = resolveTheme(config);
  const c = theme.colors || {};
  const ac = hexToAnsi(config.clockAccent || c.accent || c.primary || '#61dafb');
  const mc = hexToAnsi(c.muted || '#6c757d');

  const W = process.stdout.columns || 80;
  const H = process.stdout.rows || 24;

  // Layout (computed once)
  const sample = renderClock(new Date());
  const cw = sample[0].length;
  const padLen = Math.max(0, Math.floor((W - cw) / 2));
  const pad = ' '.repeat(padLen);
  const topPad = Math.max(0, Math.floor((H - 7) / 2));
  const clockRow = topPad + 1; // 1-based

  // ── initial draw (happens once) ────────────────────────
  process.stdout.write('\x1B[?1049h\x1B[?25l\x1B[2J\x1B[H');

  for (let i = 0; i < topPad; i++) process.stdout.write('\n');
  for (const line of sample) {
    process.stdout.write(pad + ac + line + RST + '\n');
  }
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const dp = ' '.repeat(Math.max(0, Math.floor((W - dateStr.length) / 2)));
  process.stdout.write('\n' + dp + mc + dateStr + RST + '\n');

  // ── tick — only overwrite the digit that changed ───────
  let lastKey = '';

  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const key = hh + mm + ss;
    if (key === lastKey) return;

    const lines = renderClock(now);
    const newG = [hh[0], hh[1], ':', mm[0], mm[1], ':', ss[0], ss[1]];
    const oldG = [lastKey[0], lastKey[1], ':', lastKey[2], lastKey[3], ':', lastKey[4], lastKey[5]];

    const out = [];
    for (let g = 0; g < 8; g++) {
      if (newG[g] !== oldG[g]) {
        for (let row = 0; row < 5; row++) {
          const y = clockRow + row;
          const x = padLen + GP[g] + 1;
          const seg = lines[row].substring(GP[g], GP[g] + GW[g]);
          out.push('\x1B[' + y + ';' + x + 'H' + ac + seg + RST);
        }
      }
    }

    if (out.length) process.stdout.write(out.join(''));
    lastKey = key;
  }

  // Align to second boundary
  setTimeout(() => { tick(); setInterval(tick, 1000); }, 1000 - Date.now() % 1000);

  function cleanup() {
    process.stdout.write('\x1B[?25h\x1B[?1049l');
    process.exit(0);
  }
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.stdout.on('resize', () => { lastKey = ''; tick(); });
}

module.exports = { startClock };
