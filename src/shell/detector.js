// Minimal shell detector stub for TDD
function detectShell(env) {
  env = env || process.env;
  const shell = env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (env.TERM_PROGRAM && env.TERM_PROGRAM.includes('Apple_Terminal')) return 'bash';
  return 'unknown';
}
module.exports = { detectShell };
