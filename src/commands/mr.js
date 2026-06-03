const chalk = require('chalk');
const ora = require('ora');
const gitlab = require('../integrations/gitlab');

/**
 * Listuje merge requesty z GitLab
 */
async function listMRs(options = {}) {
  const s = ora('Pobieranie merge requestów...').start();
  try {
    const mrs = await gitlab.listMRs(options);
    s.succeed(`Znaleziono ${mrs.length} merge requestów`);
    for (const mr of mrs) {
      console.log(`  ${chalk.bold(`!${mr.iid}`)} ${mr.title}`);
      console.log(`    ${chalk.gray(mr.url)}`);
    }
    return mrs;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

/**
 * Tworzy draft MR na GitLab
 */
async function draftMR(title, options = {}) {
  const s = ora('Tworzenie draft MR...').start();
  try {
    const mr = await gitlab.createDraftMR(title, options);
    s.succeed(`Draft MR utworzony: ${chalk.green(mr.url)}`);
    return mr;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

/**
 * Komentuje MR na GitLab
 */
async function commentMR(mrIid, message, options = {}) {
  const s = ora('Dodawanie komentarza...').start();
  try {
    const result = await gitlab.commentOnMR(mrIid, message, options);
    s.succeed('Komentarz dodany');
    return result;
  } catch (err) {
    s.fail(err.message);
    throw err;
  }
}

module.exports = { listMRs, draftMR, commentMR };
