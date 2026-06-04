// Assumptions:
// - /issue list supports both GitHub and GitLab
// - When multiple platforms connected — interactive selection (inquirer prompt)
// - When single platform — uses it without asking
// - When no platforms — error "no connected platforms"
// - --platform github|gitlab skips interactive selection
// - Mock integrations at system boundary

jest.mock('../../../src/integrations/github', () => ({
  getClient: jest.fn(),
  listPRs: jest.fn(),
}));

jest.mock('../../../src/integrations/gitlab', () => ({
  getClient: jest.fn(),
  listIssues: jest.fn().mockResolvedValue([
    { iid: 5, title: 'GitLab Issue', state: 'opened', url: 'https://gitlab.com/issue/5', updatedAt: '2024-01-01' },
  ]),
}));

jest.mock('../../../src/utils/keychain', () => ({
  listStoredServices: jest.fn(),
}));

const { listIssues } = require('../../../src/commands/issue');
const github = require('../../../src/integrations/github');
const gitlab = require('../../../src/integrations/gitlab');
const keychain = require('../../../src/utils/keychain');

describe('/issue list', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns issues from GitLab when only GitLab connected', async () => {
    keychain.listStoredServices.mockResolvedValue(['gitlab']);
    const result = await listIssues({ platform: 'gitlab' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('GitLab Issue');
    expect(gitlab.listIssues).toHaveBeenCalled();
  });

  test('throws error when no platforms connected', async () => {
    keychain.listStoredServices.mockResolvedValue([]);
    await expect(listIssues({})).rejects.toThrow('No connected platforms');
  });

  test('uses --platform flag without interactive selection', async () => {
    keychain.listStoredServices.mockResolvedValue(['github', 'gitlab']);
    const result = await listIssues({ platform: 'gitlab' });
    expect(gitlab.listIssues).toHaveBeenCalled();
  });
});
