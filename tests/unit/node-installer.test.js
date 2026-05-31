const { isNodeInstalled, isNvmInstalled } = require('../../src/installer/node-installer');
const { isPnpmInstalled, isNpmInstalled } = require('../../src/installer/package-manager-installer');
const { detectPlatform, isBrewInstalled, isAptInstalled } = require('../../src/installer/system-packages');

describe('Node installer', () => {
  test('isNodeInstalled returns object with installed boolean', () => {
    const result = isNodeInstalled();
    expect(result).toHaveProperty('installed');
    expect(typeof result.installed).toBe('boolean');
    if (result.installed) {
      expect(result.version).toMatch(/^v\d+/);
    }
  });

  test('isNvmInstalled returns boolean', () => {
    const result = isNvmInstalled();
    expect(typeof result).toBe('boolean');
  });
});

describe('Package manager installer', () => {
  test('isNpmInstalled returns object with installed boolean', () => {
    const result = isNpmInstalled();
    expect(result).toHaveProperty('installed');
    expect(typeof result.installed).toBe('boolean');
  });

  test('isPnpmInstalled returns object with installed boolean', () => {
    const result = isPnpmInstalled();
    expect(result).toHaveProperty('installed');
    expect(typeof result.installed).toBe('boolean');
  });
});

describe('System packages', () => {
  test('detectPlatform returns darwin or linux', () => {
    const platform = detectPlatform();
    expect(['darwin', 'linux', 'unknown']).toContain(platform);
  });

  test('isBrewInstalled returns boolean', () => {
    expect(typeof isBrewInstalled()).toBe('boolean');
  });

  test('isAptInstalled returns boolean', () => {
    expect(typeof isAptInstalled()).toBe('boolean');
  });
});
