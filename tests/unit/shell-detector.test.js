const { detectShell } = require('../../src/shell/detector');

describe('Shell detector', () => {
  test('detects zsh', () => {
    expect(detectShell({ SHELL: '/bin/zsh' })).toBe('zsh');
  });

  test('detects bash', () => {
    expect(detectShell({ SHELL: '/bin/bash' })).toBe('bash');
  });

  test('returns unknown for missing env', () => {
    expect(detectShell({})).toBe('unknown');
  });
});
