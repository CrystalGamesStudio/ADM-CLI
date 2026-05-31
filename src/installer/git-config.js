const child_process = require('child_process');
const fs = require('fs');
const path = require('os').homedir;

function getCurrentGitConfig() {
  const name = tryExec('git config --global user.name');
  const email = tryExec('git config --global user.email');
  const gpgsign = tryExec('git config --global commit.gpgsign');
  return { name, email, gpgsign };
}

function setGitConfig(key, value) {
  if (!value) return false;
  child_process.execSync(`git config --global ${key} "${value}"`, { stdio: 'pipe' });
  return true;
}

async function configureGit({ name, email, gpgsign }) {
  const results = {};
  if (name) results.name = setGitConfig('user.name', name);
  if (email) results.email = setGitConfig('user.email', email);
  if (gpgsign) results.gpgsign = setGitConfig('commit.gpgsign', gpgsign);
  return results;
}

function tryExec(cmd) {
  try {
    return child_process.execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim() || null;
  } catch {
    return null;
  }
}

module.exports = { getCurrentGitConfig, setGitConfig, configureGit };
