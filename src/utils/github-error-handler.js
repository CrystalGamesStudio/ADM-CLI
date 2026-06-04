class GitHubError extends Error {
  constructor(type, message, originalError) {
    super(message);
    this.name = 'GitHubError';
    this.type = type;
    this.originalError = originalError;
  }
}

function handleGitHubError(err) {
  if (err.status === 401 || err.status === 403) {
    return new GitHubError('auth', 'Authentication failed. Token may be expired or invalid. Run /connect to reconnect.', err);
  }
  if (err.status === 403 && err.headers && err.headers['x-ratelimit-remaining'] === '0') {
    return new GitHubError('rate_limit', 'GitHub API rate limit exceeded. Wait a few minutes and try again.', err);
  }
  if (err.status === 404) {
    return new GitHubError('not_found', 'Resource not found. Check the repository/PR number and permissions.', err);
  }
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return new GitHubError('network', 'Network error. Check your internet connection and try again.', err);
  }
  return new GitHubError('unknown', err.message || 'An unexpected error occurred.', err);
}

module.exports = { GitHubError, handleGitHubError };
