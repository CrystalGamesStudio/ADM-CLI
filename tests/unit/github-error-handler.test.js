const { GitHubError, handleGitHubError } = require('../../src/utils/github-error-handler');

describe('GitHub error handler', () => {
  test('handles 401 auth error', () => {
    const err = { status: 401, message: 'Bad credentials' };
    const result = handleGitHubError(err);
    expect(result).toBeInstanceOf(GitHubError);
    expect(result.type).toBe('auth');
    expect(result.message).toContain('Authentication failed');
  });

  test('handles 404 not found', () => {
    const err = { status: 404, message: 'Not Found' };
    const result = handleGitHubError(err);
    expect(result.type).toBe('not_found');
  });

  test('handles network error (ENOTFOUND)', () => {
    const err = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND api.github.com' };
    const result = handleGitHubError(err);
    expect(result.type).toBe('network');
    expect(result.message).toContain('Network error');
  });

  test('handles network error (ETIMEDOUT)', () => {
    const err = { code: 'ETIMEDOUT', message: 'connection timed out' };
    const result = handleGitHubError(err);
    expect(result.type).toBe('network');
  });

  test('handles unknown errors', () => {
    const err = { message: 'Something unexpected' };
    const result = handleGitHubError(err);
    expect(result.type).toBe('unknown');
  });
});
