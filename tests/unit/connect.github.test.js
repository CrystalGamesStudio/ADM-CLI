const fs = require('fs');
const os = require('os');
const path = require('path');

// Mock the GitHub integration before requiring connect
jest.mock('../../src/integrations/github', () => ({
  connect: jest.fn().mockResolvedValue({ user: { login: 'testuser' } }),
  disconnect: jest.fn().mockResolvedValue(true),
}));

const { connectGithub, listConnections, disconnect } = require('../../src/commands/connect');

describe('adm connect github (unit)', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-connect-'));
    process.env.ADM_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    delete process.env.ADM_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('connectGithub stores token and returns user', async () => {
    const result = await connectGithub({ token: 'ghp_test123' });
    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
    expect(result.user).toBe('testuser');
  });

  test('listConnections returns empty when no services', async () => {
    const result = await listConnections();
    expect(result).toEqual([]);
  });

  test('disconnect throws for unknown service', async () => {
    await expect(disconnect('unknown')).rejects.toThrow('Unknown service');
  });

  test('disconnect calls github disconnect', async () => {
    await disconnect('github');
    const github = require('../../src/integrations/github');
    expect(github.disconnect).toHaveBeenCalled();
  });
});
