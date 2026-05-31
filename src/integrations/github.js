const { Octokit } = require('@octokit/rest');
const { storeToken, retrieveToken, removeToken } = require('../utils/keychain');
const { handleGitHubError } = require('../utils/github-error-handler');

function createClient(token) {
  return new Octokit({ auth: token });
}

async function validateToken(token) {
  const octokit = createClient(token);
  try {
    const { data } = await octokit.users.getAuthenticated();
    return { valid: true, user: data };
  } catch (err) {
    throw handleGitHubError(err);
  }
}

async function connect(token) {
  const result = await validateToken(token);
  await storeToken('github', token);
  return result;
}

async function disconnect() {
  return removeToken('github');
}

async function getClient() {
  const token = await retrieveToken('github');
  if (!token) throw new Error('GitHub not connected. Run `adm connect github` first.');
  return createClient(token);
}

async function listPRs(options = {}) {
  const octokit = await getClient();
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    const { data } = await octokit.search.issuesAndPullRequests({
      q: `author:${user.login} is:pr is:open ${options.repo ? `repo:${options.repo}` : ''}`,
      sort: 'updated',
      order: 'desc',
      per_page: options.limit || 20,
    });
    return data.items.map(pr => ({
      number: pr.number,
      title: pr.title,
      repo: pr.repository_url.split('/repos/')[1],
      state: pr.state,
      url: pr.html_url,
      updatedAt: pr.updated_at,
    }));
  } catch (err) {
    throw handleGitHubError(err);
  }
}

async function createDraftPR(title, options = {}) {
  const octokit = await getClient();
  try {
    const { execSync } = require('child_process');
    const branch = options.branch || execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/[:/]([^/]+\/[^/.]+)/);
    if (!repoMatch) throw new Error('Could not detect repo from git remote.');
    const repo = repoMatch[1];

    const base = options.base || 'main';
    const { data } = await octokit.pulls.create({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      title,
      head: branch,
      base,
      draft: true,
    });
    return { number: data.number, url: data.html_url, draft: data.draft };
  } catch (err) {
    throw handleGitHubError(err);
  }
}

async function commentOnPR(prNumber, message, options = {}) {
  const octokit = await getClient();
  try {
    const repo = options.repo || await detectRepo();
    const [owner, name] = repo.split('/');
    const { data } = await octokit.issues.createComment({
      owner, repo: name, issue_number: prNumber, body: message,
    });
    return { id: data.id, url: data.html_url };
  } catch (err) {
    throw handleGitHubError(err);
  }
}

async function detectRepo() {
  const { execSync } = require('child_process');
  const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  const match = remoteUrl.match(/[:/]([^/]+\/[^/.]+)/);
  if (!match) throw new Error('Could not detect repo from git remote.');
  return match[1];
}

module.exports = {
  connect, disconnect, getClient, listPRs, createDraftPR, commentOnPR, detectRepo,
};
