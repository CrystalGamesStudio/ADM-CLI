class AdmError extends Error {
  constructor(type, message, exitCode = 1, remediation = null) {
    super(message);
    this.name = 'AdmError';
    this.type = type;
    this.exitCode = exitCode;
    this.remediation = remediation;
  }
}

function stripSensitive(msg) {
  if (typeof msg !== 'string') return String(msg ?? '');
  return msg
    .replace(/ghp_[A-Za-z0-9]{20,}/g, '<TOKEN>')
    .replace(/glpat-[A-Za-z0-9\-]{20,}/g, '<TOKEN>')
    .replace(/Bearer\s+\S+/gi, 'Bearer <TOKEN>');
}

function handleAdmError(err) {
  // String error
  if (typeof err === 'string') {
    return new AdmError('unknown', err, 1, 'Type /help for available commands.');
  }

  // Network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return new AdmError('network', 'Network error. Check your internet connection.', 1, 'Check your internet connection and try again.');
  }

  // Auth errors (401/403 without rate limit)
  if (err.status === 401) {
    return new AdmError('auth', stripSensitive('Authentication failed. Token may be expired or invalid.'), 1, 'Run /connect to reconnect.');
  }

  if (err.status === 403) {
    if (err.headers && err.headers['x-ratelimit-remaining'] === '0') {
      return new AdmError('rate_limit', 'GitHub API rate limit exceeded.', 1, 'Wait a few minutes and try again.');
    }
    return new AdmError('auth', stripSensitive('Authentication failed. Token may be expired or invalid.'), 1, 'Run /connect to reconnect.');
  }

  // Not found
  if (err.status === 404) {
    return new AdmError('not_found', 'Resource not found.', 1, 'Check the repository/PR number and your permissions.');
  }

  // User errors — validation, missing arguments
  const msg = stripSensitive(err.message || 'An unexpected error occurred.');
  if (/missing required argument|argument.*required|must provide/i.test(msg)) {
    return new AdmError('user_error', msg, 2, 'Type /help for available commands.');
  }

  // Unknown / fallback
  return new AdmError('unknown', msg, 1, 'If this persists, file an issue at https://github.com/adm-cli/adm/issues.');
}

function formatError(err) {
  if (err instanceof AdmError) {
    let msg = `Error: ${err.message}`;
    if (err.remediation) {
      msg += `\n  → ${err.remediation}`;
    }
    return msg;
  }
  // Plain Error or anything else
  return `Error: ${err.message || String(err)}`;
}

module.exports = { AdmError, handleAdmError, formatError };
