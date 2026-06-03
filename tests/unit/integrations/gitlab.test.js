// Założenia (Assumptions):
// - GitLab integration mirroruje wzór z github.js
// - Używa @gitbeaker/node jako klient API (lub fetch jeśli SDK niedostępne)
// - Token przechowywany przez keychain (jak GitHub) pod nazwą 'gitlab'
// - Podstawowe metody: connect, getClient, listMRs, createDraftMR, commentOnMR
// - Błędy API mapowane przez gitlab-error-handler (podobny do github-error-handler)
// - Mockujemy tylko na granicy systemu: HTTP API, keychain

jest.mock('../../../src/utils/keychain', () => ({
  storeToken: jest.fn().mockResolvedValue('encrypted-file'),
  retrieveToken: jest.fn().mockResolvedValue('glpat-testtoken123'),
  removeToken: jest.fn().mockResolvedValue(true),
}));

jest.mock('@gitbeaker/node', () => {
  return {
    Gitlab: jest.fn().mockImplementation(() => ({
      Users: { current: jest.fn().mockResolvedValue({ id: 42, username: 'testuser' }) },
      MergeRequests: {
        all: jest.fn().mockResolvedValue([
          { iid: 1, title: 'Test MR', project_id: 10, state: 'opened', web_url: 'https://gitlab.com/test/mr/1' },
        ]),
        create: jest.fn().mockResolvedValue({
          iid: 2, title: 'Nowy MR', web_url: 'https://gitlab.com/test/mr/2',
        }),
      },
      MergeRequestNotes: {
        create: jest.fn().mockResolvedValue({ id: 100, body: 'Komentarz testowy' }),
      },
      Issues: {
        all: jest.fn().mockResolvedValue([
          { iid: 5, title: 'Test issue', project_id: 10, state: 'opened', web_url: 'https://gitlab.com/test/issue/5' },
        ]),
      },
    })),
  };
}, { virtual: true });

const gitlab = require('../../../src/integrations/gitlab');
const keychain = require('../../../src/utils/keychain');

describe('GitLab Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('connect waliduje token i zapisuje do keychain', async () => {
    const result = await gitlab.connect('glpat-testtoken123');
    expect(result.valid).toBe(true);
    expect(result.user.username).toBe('testuser');
    expect(keychain.storeToken).toHaveBeenCalledWith('gitlab', 'glpat-testtoken123');
  });

  test('getClient zwraca instancję Gitlab gdy token istnieje', async () => {
    const client = await gitlab.getClient();
    expect(client).toBeDefined();
  });

  test('getClient rzuca błąd gdy token brak', async () => {
    keychain.retrieveToken.mockResolvedValueOnce(null);
    await expect(gitlab.getClient()).rejects.toThrow('GitLab not connected');
  });

  test('disconnect usuwa token', async () => {
    await gitlab.disconnect();
    expect(keychain.removeToken).toHaveBeenCalledWith('gitlab');
  });

  test('listMRs zwraca listę merge requestów', async () => {
    const mrs = await gitlab.listMRs({ limit: 10 });
    expect(mrs).toHaveLength(1);
    expect(mrs[0]).toHaveProperty('iid', 1);
    expect(mrs[0]).toHaveProperty('title', 'Test MR');
    expect(mrs[0]).toHaveProperty('url');
  });

  test('createDraftMR tworzy draft merge request', async () => {
    const mr = await gitlab.createDraftMR('Tytuł MR', { projectId: 10, sourceBranch: 'feature' });
    expect(mr).toHaveProperty('iid', 2);
    expect(mr).toHaveProperty('url');
  });

  test('commentOnMR dodaje komentarz', async () => {
    const result = await gitlab.commentOnMR(1, 'Komentarz testowy', { projectId: 10 });
    expect(result).toHaveProperty('id', 100);
  });
});
