// Założenia:
// - adm issue list wspiera zarówno GitHub jak i GitLab
// - Gdy wiele platform podłączonych — interaktywny wybór (inquirer prompt)
// - Gdy jedna platforma — używa jej bez pytania
// - Gdy brak platform — błąd "brak podłączonych platform"
// - --platform github|gitlab pomija interaktywny wybór
// - Mockujemy integracje na granicy systemu

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

describe('adm issue list', () => {
  afterEach(() => jest.clearAllMocks());

  test('zwraca issues z GitLab gdy tylko GitLab podłączony', async () => {
    keychain.listStoredServices.mockResolvedValue(['gitlab']);
    const result = await listIssues({ platform: 'gitlab' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('GitLab Issue');
    expect(gitlab.listIssues).toHaveBeenCalled();
  });

  test('rzuca błąd gdy brak podłączonych platform', async () => {
    keychain.listStoredServices.mockResolvedValue([]);
    await expect(listIssues({})).rejects.toThrow('Brak podłączonych platform');
  });

  test('używa flagi --platform bez interaktywnego wyboru', async () => {
    keychain.listStoredServices.mockResolvedValue(['github', 'gitlab']);
    const result = await listIssues({ platform: 'gitlab' });
    expect(gitlab.listIssues).toHaveBeenCalled();
  });
});
