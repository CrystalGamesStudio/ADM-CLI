/**
 * Assumptions:
 * - detectColorSupport() returns boolean
 * - isDarkMode() returns boolean (best-guess from env)
 * - isCI() returns boolean (checks CI=true, or common CI env vars)
 * - isTTY() returns boolean (checks process.stdout.isTTY)
 *
 * Boundaries:
 * - CI env vars: CI, TF_BUILD, GITHUB_ACTIONS, JENKINS_URL, etc.
 * - NO_COLOR / TERM=dumb → no color support
 * - COLORTERM → truecolor support
 */
const {
  detectColorSupport,
  isDarkMode,
  isCI,
  isTTY,
} = require('../../../src/utils/terminal-detection');

describe('Terminal detection', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('isCI', () => {
    test('returns true when CI=true', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    test('returns false when CI is not set', () => {
      delete process.env.CI;
      delete process.env.TF_BUILD;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.JENKINS_URL;
      expect(isCI()).toBe(false);
    });

    test('returns true when GITHUB_ACTIONS is set', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCI()).toBe(true);
    });
  });

  describe('detectColorSupport', () => {
    test('returns false when NO_COLOR is set', () => {
      process.env.NO_COLOR = '1';
      expect(detectColorSupport()).toBe(false);
    });

    test('returns false when TERM=dumb', () => {
      process.env.TERM = 'dumb';
      delete process.env.NO_COLOR;
      expect(detectColorSupport()).toBe(false);
    });

    test('returns true when COLORTERM is set', () => {
      delete process.env.NO_COLOR;
      process.env.COLORTERM = 'truecolor';
      process.env.TERM = 'xterm-256color';
      expect(detectColorSupport()).toBe(true);
    });
  });

  describe('isDarkMode', () => {
    test('defaults to true (dark terminals are more common for devs)', () => {
      delete process.env.COLORFGBG;
      expect(isDarkMode()).toBe(true);
    });

    test('returns false when COLORFGBG indicates light background', () => {
      process.env.COLORFGBG = '0;15';
      expect(isDarkMode()).toBe(false);
    });

    test('returns true when COLORFGBG indicates dark background', () => {
      process.env.COLORFGBG = '15;0';
      expect(isDarkMode()).toBe(true);
    });
  });

  describe('isTTY', () => {
    test('returns process.stdout.isTTY value', () => {
      const original = process.stdout.isTTY;
      const result = isTTY();
      expect(result).toBe(Boolean(original));
    });
  });
});
