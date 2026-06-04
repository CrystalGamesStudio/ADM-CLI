const { storeToken, retrieveToken, removeToken } = require('../utils/keychain');

/**
 * GitLab API wrapper — mirrors the pattern from github.js
 * Uses @gitbeaker/node as API client
 */

let Gitlab;
try {
  Gitlab = require('@gitbeaker/node').Gitlab;
} catch {
  // @gitbeaker/node unavailable — API methods will throw
}

function createClient(token) {
  if (!Gitlab) throw new Error('Package @gitbeaker/node is not installed. Run: npm install @gitbeaker/node');
  return new Gitlab({ token });
}

async function validateToken(token) {
  const client = createClient(token);
  try {
    const user = await client.Users.current();
    return { valid: true, user };
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    throw new Error(`GitLab token validation failed: ${message}`);
  }
}

async function connect(token) {
  const result = await validateToken(token);
  await storeToken('gitlab', token);
  return result;
}

async function disconnect() {
  return removeToken('gitlab');
}

async function getClient() {
  const token = await retrieveToken('gitlab');
  if (!token) throw new Error('GitLab not connected. Run /connect gitlab first.');
  return createClient(token);
}

async function listMRs(options = {}) {
  const client = await getClient();
  try {
    const mrs = await client.MergeRequests.all({
      state: 'opened',
      scope: 'created_by_me',
      perPage: options.limit || 20,
    });
    return mrs.map(mr => ({
      iid: mr.iid,
      title: mr.title,
      projectId: mr.project_id,
      state: mr.state,
      url: mr.web_url,
      updatedAt: mr.updated_at,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch MRs: ${err.message}`);
  }
}

async function createDraftMR(title, options = {}) {
  const client = await getClient();
  try {
    const mr = await client.MergeRequests.create(
      options.projectId,
      options.sourceBranch || 'main',
      options.targetBranch || 'main',
      title,
      { draft: true },
    );
    return { iid: mr.iid, url: mr.web_url, draft: true };
  } catch (err) {
    throw new Error(`Failed to create MR: ${err.message}`);
  }
}

async function commentOnMR(mrIid, message, options = {}) {
  const client = await getClient();
  try {
    const note = await client.MergeRequestNotes.create(
      options.projectId,
      mrIid,
      message,
    );
    return { id: note.id, body: note.body };
  } catch (err) {
    throw new Error(`Failed to comment on MR: ${err.message}`);
  }
}

async function listIssues(options = {}) {
  const client = await getClient();
  try {
    const issues = await client.Issues.all({
      state: 'opened',
      scope: 'created_by_me',
      perPage: options.limit || 20,
    });
    return issues.map(issue => ({
      iid: issue.iid,
      title: issue.title,
      projectId: issue.project_id,
      state: issue.state,
      url: issue.web_url,
      updatedAt: issue.updated_at,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch issues: ${err.message}`);
  }
}

module.exports = {
  connect, disconnect, getClient, listMRs, createDraftMR, commentOnMR, listIssues,
};
