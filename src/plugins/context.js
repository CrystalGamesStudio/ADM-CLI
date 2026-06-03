const chalk = require('chalk');
const { readConfig } = require('../config');
const github = require('../integrations/github');

/**
 * Bezpieczne ładowanie modułu integracji — zwraca null gdy moduł niedostępny
 */
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch {
    return null;
  }
}

/**
 * Tworzy wrapper API dla danej integracji (github/gitlab)
 * Zwraca null gdy platforma nie jest podłączona
 */
async function buildPlatformApi(integration, methods) {
  if (!integration) return null;
  try {
    await integration.getClient();
  } catch {
    return null;
  }

  const api = {};
  for (const method of methods) {
    if (typeof integration[method] === 'function') {
      api[method] = (...args) => integration[method](...args);
    }
  }
  return api;
}

/**
 * Tworzy obiekt kontekstu przekazywany do wtyczek
 * { config, logger, github, gitlab }
 */
async function createPluginContext() {
  const config = await readConfig();

  const logger = {
    info: (msg) => console.log(chalk.blue(`  ℹ ${msg}`)),
    warn: (msg) => console.log(chalk.yellow(`  ⚠ ${msg}`)),
    error: (msg) => console.log(chalk.red(`  ✖ ${msg}`)),
    success: (msg) => console.log(chalk.green(`  ✔ ${msg}`)),
  };

  const gitlab = safeRequire('../integrations/gitlab');

  const githubApi = await buildPlatformApi(github, ['listPRs', 'createDraftPR', 'commentOnPR']);
  const gitlabApi = await buildPlatformApi(gitlab, ['listMRs', 'createDraftMR', 'commentOnMR']);

  return {
    config,
    logger,
    github: githubApi,
    gitlab: gitlabApi,
  };
}

module.exports = { createPluginContext };
