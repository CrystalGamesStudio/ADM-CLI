const { listPRs, draftPR, commentPR } = require('../../src/commands/pr');

// Mock the github integration
jest.mock('../../src/integrations/github', () => ({
  listPRs: jest.fn().mockResolvedValue([
    { number: 42, title: 'Test PR', repo: 'org/repo', state: 'open', url: 'https://github.com/org/repo/pull/42', updatedAt: '2024-01-01' },
  ]),
  createDraftPR: jest.fn().mockResolvedValue({
    number: 43, url: 'https://github.com/org/repo/pull/43', draft: true,
  }),
  commentOnPR: jest.fn().mockResolvedValue({
    id: 999, url: 'https://github.com/org/repo/issues/42#issuecomment-999',
  }),
}));

describe('PR commands', () => {
  test('listPRs returns array of PRs', async () => {
    const prs = await listPRs();
    expect(prs.length).toBeGreaterThan(0);
    expect(prs[0]).toHaveProperty('number', 42);
    expect(prs[0]).toHaveProperty('title', 'Test PR');
  });

  test('draftPR creates a draft PR', async () => {
    const result = await draftPR('My new feature');
    expect(result).toHaveProperty('number', 43);
    expect(result).toHaveProperty('draft', true);
  });

  test('commentPR adds a comment', async () => {
    const result = await commentPR(42, 'Looks good!');
    expect(result).toHaveProperty('id', 999);
  });
});
