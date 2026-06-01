const CI_ENV_VARS = ['CI', 'TF_BUILD', 'GITHUB_ACTIONS', 'JENKINS_URL', 'BUILDKITE', 'TRAVIS', 'CIRCLECI', 'GITLAB_CI'];

function isCI() {
  return CI_ENV_VARS.some(key => process.env[key]);
}

function isTTY() {
  return Boolean(process.stdout.isTTY);
}

function detectColorSupport() {
  if (process.env.NO_COLOR) return false;
  if (process.env.TERM === 'dumb') return false;
  return Boolean(process.env.COLORTERM || process.env.TERM?.includes('color') || process.env.TERM?.includes('xterm'));
}

function isDarkMode() {
  const colorfgbg = process.env.COLORFGBG;
  if (!colorfgbg) return true;
  const parts = colorfgbg.split(';');
  if (parts.length < 2) return true;
  const bg = parseInt(parts[1], 10);
  return bg < 8;
}

function shouldEnableAnimations(config = {}) {
  if (isCI()) return false;
  if (config.animations === false) return false;
  if (!isTTY()) return false;
  return true;
}

module.exports = { detectColorSupport, isDarkMode, shouldEnableAnimations, isCI, isTTY };
