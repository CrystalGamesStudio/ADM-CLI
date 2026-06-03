// Założenia:
// - adm mr list wywołuje gitlab.listMRs i formatuje output
// - adm mr draft tworzy draft MR przez gitlab.createDraftMR
// - adm mr comment dodaje komentarz przez gitlab.commentOnMR
// - Błędy wyświetlane przez ora spinner + chalk
// - Mockujemy integrację gitlab na granicy systemu

jest.mock('../../../src/integrations/gitlab', () => ({
  listMRs: jest.fn().mockResolvedValue([
    { iid: 1, title: 'Test MR', projectId: 10, state: 'opened', url: 'https://gitlab.com/mr/1', updatedAt: '2024-01-01' },
  ]),
  createDraftMR: jest.fn().mockResolvedValue({
    iid: 2, url: 'https://gitlab.com/mr/2', draft: true,
  }),
  commentOnMR: jest.fn().mockResolvedValue({
    id: 100, body: 'Komentarz',
  }),
}));

const { listMRs, draftMR, commentMR } = require('../../../src/commands/mr');
const gitlab = require('../../../src/integrations/gitlab');

describe('adm mr (GitLab)', () => {
  afterEach(() => jest.clearAllMocks());

  test('listMRs wywołuje gitlab.listMRs i zwraca dane', async () => {
    const result = await listMRs({ limit: 10 });
    expect(gitlab.listMRs).toHaveBeenCalledWith({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].iid).toBe(1);
  });

  test('draftMR wywołuje gitlab.createDraftMR', async () => {
    const result = await draftMR('Nowy MR', { projectId: 10, sourceBranch: 'feature' });
    expect(gitlab.createDraftMR).toHaveBeenCalledWith('Nowy MR', { projectId: 10, sourceBranch: 'feature' });
    expect(result.iid).toBe(2);
  });

  test('commentMR wywołuje gitlab.commentOnMR', async () => {
    await commentMR(1, 'Komentarz testowy', { projectId: 10 });
    expect(gitlab.commentOnMR).toHaveBeenCalledWith(1, 'Komentarz testowy', { projectId: 10 });
  });
});
