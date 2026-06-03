// Założenia (Assumptions):
// - Kontekst wtyczki to obiekt przekazywany do plugin.execute(args, context)
// - Zawiera: config (z ~/.adm/config.json), logger (wrapper console), github, gitlab
// - github i gitlab to obiekty z metodami API (lub null gdy nie podłączony)
// - Kontekst jest tworzony przez createPluginContext() i zależy od stanu aplikacji
// - Nie mockujemy modułów wewnętrznych — testujemy kształt obiektu kontekstu

const { createPluginContext } = require('../../../src/plugins/context');

// Mockujemy integracje na granicy systemu (keychain/API)
jest.mock('../../../src/integrations/github', () => ({
  getClient: jest.fn().mockResolvedValue({ fake: 'octokit' }),
  listPRs: jest.fn().mockResolvedValue([{ number: 1, title: 'Test PR' }]),
  detectRepo: jest.fn().mockReturnValue('owner/repo'),
}));

jest.mock('../../../src/integrations/gitlab', () => ({
  getClient: jest.fn().mockResolvedValue({ fake: 'gitlab' }),
  listMRs: jest.fn().mockResolvedValue([{ iid: 2, title: 'Test MR' }]),
}), { virtual: true });

jest.mock('../../../src/config', () => ({
  readConfig: jest.fn().mockResolvedValue({ installed: true, shell: 'bash' }),
}));

describe('Plugin Context API', () => {
  test('kontekst zawiera klucze: config, logger, github, gitlab', async () => {
    const ctx = await createPluginContext();

    expect(ctx).toHaveProperty('config');
    expect(ctx).toHaveProperty('logger');
    expect(ctx).toHaveProperty('github');
    expect(ctx).toHaveProperty('gitlab');
  });

  test('config zawiera dane z ~/.adm/config.json', async () => {
    const ctx = await createPluginContext();
    expect(ctx.config).toEqual({ installed: true, shell: 'bash' });
  });

  test('logger posiada metody info, warn, error, success', async () => {
    const ctx = await createPluginContext();
    expect(typeof ctx.logger.info).toBe('function');
    expect(typeof ctx.logger.warn).toBe('function');
    expect(typeof ctx.logger.error).toBe('function');
    expect(typeof ctx.logger.success).toBe('function');
  });

  test('github object posiada metody API gdy klient dostępny', async () => {
    const ctx = await createPluginContext();
    expect(typeof ctx.github.listPRs).toBe('function');
  });

  test('gitlab object posiada metody API gdy klient dostępny', async () => {
    const ctx = await createPluginContext();
    expect(typeof ctx.gitlab.listMRs).toBe('function');
  });

  test('github zwraca null gdy nie podłączony', async () => {
    const github = require('../../../src/integrations/github');
    github.getClient.mockRejectedValueOnce(new Error('Not connected'));

    const ctx = await createPluginContext();
    expect(ctx.github).toBeNull();
  });

  test('gitlab zwraca null gdy nie podłączony', async () => {
    const gitlab = require('../../../src/integrations/gitlab');
    gitlab.getClient.mockRejectedValueOnce(new Error('Not connected'));

    const ctx = await createPluginContext();
    expect(ctx.gitlab).toBeNull();
  });
});
