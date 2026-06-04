const { listProviders, getProvider, queryWithProvider } = require('../../../../src/integrations/ai-providers/registry');

describe('Provider registry', () => {
  test('lists exactly 5 providers', () => {
    const providers = listProviders();
    expect(providers).toHaveLength(5);
  });

  test('includes all required provider ids', () => {
    const ids = listProviders().map(p => p.id);
    expect(ids).toContain('glm-free');
    expect(ids).toContain('glm-pro');
    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('ollama');
  });

  test('each provider has id, name, and requiresAuth', () => {
    for (const p of listProviders()) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('requiresAuth');
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.requiresAuth).toBe('boolean');
    }
  });
});

describe('GLM Free provider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env.GLM_API_KEY = 'test-glm-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GLM_API_KEY;
  });

  test('queryWithProvider sends request to GLM API and returns response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Hello from GLM!' } }],
      }),
    });

    const result = await queryWithProvider('glm-free', 'hello');
    expect(result).toBe('Hello from GLM!');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('open.bigmodel.cn'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('queryWithProvider throws on unknown provider', async () => {
    await expect(queryWithProvider('nonexistent', 'hello')).rejects.toThrow('Unknown provider');
  });
});

describe('OpenAI provider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sends request to api.openai.com with Bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Hello from OpenAI!' } }],
      }),
    });

    const result = await queryWithProvider('openai', 'hello', { apiKey: 'sk-test-key' });
    expect(result).toBe('Hello from OpenAI!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('api.openai.com');
    expect(init.headers['Authorization']).toBe('Bearer sk-test-key');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('openai', 'hello')).rejects.toThrow('API key');
  });
});

describe('Anthropic provider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sends request to api.anthropic.com with x-api-key header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Hello from Claude!' }],
      }),
    });

    const result = await queryWithProvider('anthropic', 'hello', { apiKey: 'sk-ant-test' });
    expect(result).toBe('Hello from Claude!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('api.anthropic.com');
    expect(init.headers['x-api-key']).toBe('sk-ant-test');
    expect(init.headers['anthropic-version']).toBeDefined();

    const body = JSON.parse(init.body);
    expect(body.model).toBe('claude-sonnet-4-6-20250514');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('anthropic', 'hello')).rejects.toThrow('API key');
  });
});

describe('Ollama provider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sends request to localhost:11434 with default URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: 'Hello from Ollama!' },
      }),
    });

    const result = await queryWithProvider('ollama', 'hello');
    expect(result).toBe('Hello from Ollama!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('localhost:11434');
    expect(url).toContain('/api/chat');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('llama3');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
    expect(body.stream).toBe(false);
  });

  test('uses custom baseUrl when provided', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: 'ok' },
      }),
    });

    await queryWithProvider('ollama', 'hello', { baseUrl: 'http://custom:9999' });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('custom:9999');
  });
});

describe('Fallback to GLM Free', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env.GLM_API_KEY = 'test-glm-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GLM_API_KEY;
  });

  test('when OpenAI fails, falls back to GLM Free', async () => {
    const callCount = { n: 0 };
    global.fetch = jest.fn().mockImplementation((url) => {
      callCount.n++;
      if (url.includes('openai.com')) {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('error') });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'GLM fallback response' } }],
        }),
      });
    });

    const result = await queryWithProvider('openai', 'hello', { apiKey: 'sk-test', fallback: 'glm-free' });
    expect(result).toBe('GLM fallback response');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][0]).toContain('open.bigmodel.cn');
  });

  test('when provider fails and no fallback, throws original error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('server error'),
    });

    await expect(queryWithProvider('openai', 'hello', { apiKey: 'sk-test' }))
      .rejects.toThrow('OpenAI API returned 500');
  });
});
