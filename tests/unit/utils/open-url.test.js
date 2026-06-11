const { openUrl } = require('../../../src/utils/open-url');

describe('openUrl', () => {
  const origPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: origPlatform });
  });

  function mockPlatform(platform) {
    Object.defineProperty(process, 'platform', { value: platform });
  }

  test('uses "open" on macOS', async () => {
    mockPlatform('darwin');
    const calls = [];
    const mockExec = (cmd) => { calls.push(cmd); };
    await openUrl('https://example.com', { exec: mockExec });
    expect(calls[0]).toMatch(/^open\s/);
    expect(calls[0]).toContain('https://example.com');
  });

  test('uses "xdg-open" on Linux', async () => {
    mockPlatform('linux');
    const calls = [];
    const mockExec = (cmd) => { calls.push(cmd); };
    await openUrl('https://example.com', { exec: mockExec });
    expect(calls[0]).toMatch(/^xdg-open\s/);
    expect(calls[0]).toContain('https://example.com');
  });
});
