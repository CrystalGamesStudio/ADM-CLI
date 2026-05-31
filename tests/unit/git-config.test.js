const { getCurrentGitConfig, configureGit, setGitConfig } = require('../../src/installer/git-config');

describe('Git config', () => {
  test('getCurrentGitConfig returns an object with name, email, gpgsign', () => {
    const config = getCurrentGitConfig();
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('email');
    expect(config).toHaveProperty('gpgsign');
  });

  test('setGitConfig returns false for empty value', () => {
    expect(setGitConfig('user.name', '')).toBe(false);
    expect(setGitConfig('user.name', null)).toBe(false);
  });

  test('setGitConfig sets value and returns true', () => {
    const result = setGitConfig('user.name', 'Test User');
    expect(result).toBe(true);
    const config = getCurrentGitConfig();
    expect(config.name).toBe('Test User');
    // Cleanup
    setGitConfig('user.name', '');
  });

  test('configureGit applies all provided fields', async () => {
    const results = await configureGit({
      name: 'ADM Test',
      email: 'adm@test.local',
      gpgsign: 'false',
    });
    expect(results.name).toBe(true);
    expect(results.email).toBe(true);
    expect(results.gpgsign).toBe(true);
  });
});
