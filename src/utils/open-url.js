const { exec } = require('child_process');

function openUrl(url, deps = {}) {
  const execFn = deps.exec || ((cmd) => {
    return new Promise((resolve, reject) => {
      exec(cmd, (err) => err ? reject(err) : resolve());
    });
  });
  const cmd = process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;
  return execFn(cmd);
}

module.exports = { openUrl };
