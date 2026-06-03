/**
 * Error Handler — centralized error handling for ADM CLI
 *
 * Assumptions:
 * - Exit codes: 0=success, 1=system error, 2=user error
 * - Every AdmError has: type, message, exitCode, remediation
 * - remediation is a human-readable hint (e.g. "Run: adm connect github")
 * - Error types: auth, network, not_found, rate_limit, user_error, unknown
 * - Sensitive data (tokens, passwords) must NOT appear in messages
 */
const { AdmError, handleAdmError, formatError } = require('../../src/utils/error-handler');

describe('AdmError', () => {
  test('creates error with type, message, exitCode, and remediation', () => {
    const err = new AdmError('auth', 'Token expired', 1, 'Run: adm connect github');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AdmError);
    expect(err.name).toBe('AdmError');
    expect(err.type).toBe('auth');
    expect(err.message).toBe('Token expired');
    expect(err.exitCode).toBe(1);
    expect(err.remediation).toBe('Run: adm connect github');
  });
});

describe('handleAdmError', () => {
  test('maps 401/403 auth error to exit 1 with remediation hint', () => {
    const result = handleAdmError({ status: 401, message: 'Bad credentials' });
    expect(result).toBeInstanceOf(AdmError);
    expect(result.type).toBe('auth');
    expect(result.exitCode).toBe(1);
    expect(result.message).toContain('Authentication failed');
    expect(result.remediation).toContain('adm connect');
  });

  test('maps 403 rate-limit error to exit 1 with wait hint', () => {
    const result = handleAdmError({
      status: 403,
      headers: { 'x-ratelimit-remaining': '0' },
      message: 'API rate limit exceeded',
    });
    expect(result.type).toBe('rate_limit');
    expect(result.exitCode).toBe(1);
    expect(result.remediation).toContain('Wait');
  });

  test('maps 404 not-found error to exit 1', () => {
    const result = handleAdmError({ status: 404, message: 'Not Found' });
    expect(result.type).toBe('not_found');
    expect(result.exitCode).toBe(1);
    expect(result.remediation).toContain('Check');
  });

  test('maps network error (ENOTFOUND) to exit 1', () => {
    const result = handleAdmError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' });
    expect(result.type).toBe('network');
    expect(result.exitCode).toBe(1);
    expect(result.remediation).toContain('internet');
  });

  test('maps network error (ETIMEDOUT) to exit 1', () => {
    const result = handleAdmError({ code: 'ETIMEDOUT', message: 'connection timed out' });
    expect(result.type).toBe('network');
    expect(result.exitCode).toBe(1);
  });

  test('maps user error (validation) to exit 2', () => {
    const result = handleAdmError(new Error('Missing required argument: repo'));
    expect(result.type).toBe('user_error');
    expect(result.exitCode).toBe(2);
    expect(result.remediation).toContain('adm --help');
  });

  test('maps unknown error to exit 1', () => {
    const result = handleAdmError(new Error('Something unexpected'));
    expect(result.type).toBe('unknown');
    expect(result.exitCode).toBe(1);
  });

  test('handles string error', () => {
    const result = handleAdmError('plain string error');
    expect(result).toBeInstanceOf(AdmError);
    expect(result.type).toBe('unknown');
    expect(result.message).toBe('plain string error');
    expect(result.exitCode).toBe(1);
  });

  test('strips sensitive data (tokens) from error message', () => {
    const result = handleAdmError({ status: 401, message: 'Bad token ghp_ABCDEFGH123456' });
    expect(result.message).not.toContain('ghp_ABCDEFGH123456');
    expect(result.message).not.toContain('ghp_');
  });
});

describe('formatError', () => {
  test('returns formatted string with error message', () => {
    const err = new AdmError('auth', 'Token expired', 1, 'Run: adm connect github');
    const formatted = formatError(err);
    expect(formatted).toContain('Token expired');
  });

  test('includes remediation hint when present', () => {
    const err = new AdmError('auth', 'Token expired', 1, 'Run: adm connect github');
    const formatted = formatError(err);
    expect(formatted).toContain('Run: adm connect github');
  });

  test('works without remediation', () => {
    const err = new AdmError('unknown', 'Something broke', 1);
    const formatted = formatError(err);
    expect(formatted).toContain('Something broke');
  });

  test('handles plain Error objects', () => {
    const err = new Error('generic error');
    const formatted = formatError(err);
    expect(formatted).toContain('generic error');
  });
});
