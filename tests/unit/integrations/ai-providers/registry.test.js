const { listProviders, getProvider, queryWithProvider } = require('../../../../src/integrations/ai-providers/registry');

describe('Provider registry', () => {
  test('lists all registered providers', () => {
    const providers = listProviders();
    expect(providers.length).toBeGreaterThanOrEqual(6);
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

describe('Groq provider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sends request to api.groq.com with Bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Hello from Groq!' } }],
      }),
    });

    const result = await queryWithProvider('groq', 'hello', { apiKey: 'gsk-test-key' });
    expect(result).toBe('Hello from Groq!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('api.groq.com');
    expect(init.headers['Authorization']).toBe('Bearer gsk-test-key');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('groq', 'hello')).rejects.toThrow('API key');
  });
});

describe('OpenAI-compatible providers', () => {
  let originalFetch;

  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  const compatProviders = [
    { id: 'deepseek', baseUrl: 'api.deepseek.com', model: 'deepseek-chat', name: 'DeepSeek' },
    { id: 'mistral', baseUrl: 'api.mistral.ai', model: 'mistral-large-latest', name: 'Mistral' },
    { id: 'perplexity', baseUrl: 'api.perplexity.ai', model: 'sonar', name: 'Perplexity' },
    { id: 'openrouter', baseUrl: 'openrouter.ai/api/v1', model: 'auto', name: 'OpenRouter' },
    { id: 'together', baseUrl: 'api.together.xyz/v1', model: 'meta-llama/Llama-3-70b', name: 'Together' },
    { id: 'fireworks', baseUrl: 'api.fireworks.ai/inference/v1', model: 'llama-v3-70b', name: 'Fireworks' },
    { id: 'xai', baseUrl: 'api.x.ai/v1', model: 'grok-3', name: 'Grok' },
  ];

  for (const { id, baseUrl, model, name } of compatProviders) {
    describe(`${name} provider`, () => {
      test(`sends request to ${baseUrl} with Bearer token and correct model`, async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { role: 'assistant', content: `Hello from ${name}!` } }],
          }),
        });

        const result = await queryWithProvider(id, 'hello', { apiKey: 'test-key' });
        expect(result).toBe(`Hello from ${name}!`);

        const [url, init] = global.fetch.mock.calls[0];
        expect(url).toContain(baseUrl);

        const body = JSON.parse(init.body);
        expect(body.model).toBe(model);
        expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
      });

      test('throws when no API key provided', async () => {
        await expect(queryWithProvider(id, 'hello')).rejects.toThrow('API key');
      });
    });
  }
});

describe('Google Gemini provider', () => {
  let originalFetch;

  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  test('sends request to generativelanguage.googleapis.com with API key in URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hello from Gemini!' }] } }],
      }),
    });

    const result = await queryWithProvider('gemini', 'hello', { apiKey: 'test-gemini-key' });
    expect(result).toBe('Hello from Gemini!');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('key=test-gemini-key');
    expect(url).toContain('gemini-2.0-flash');
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('gemini', 'hello')).rejects.toThrow('API key');
  });
});

describe('Cohere provider', () => {
  let originalFetch;

  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  test('sends request to api.cohere.com with Bearer token and parses v2 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { content: [{ type: 'text', text: 'Hello from Cohere!' }] },
      }),
    });

    const result = await queryWithProvider('cohere', 'hello', { apiKey: 'test-cohere-key' });
    expect(result).toBe('Hello from Cohere!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('api.cohere.com');
    expect(init.headers['Authorization']).toBe('Bearer test-cohere-key');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('command-r-plus');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('cohere', 'hello')).rejects.toThrow('API key');
  });
});

describe('Qwen provider', () => {
  let originalFetch;

  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  test('sends request to dashscope.aliyuncs.com with Bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Hello from Qwen!' } }],
      }),
    });

    const result = await queryWithProvider('qwen', 'hello', { apiKey: 'test-qwen-key' });
    expect(result).toBe('Hello from Qwen!');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('dashscope.aliyuncs.com');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('qwen-turbo');
  });

  test('throws when no API key provided', async () => {
    await expect(queryWithProvider('qwen', 'hello')).rejects.toThrow('API key');
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
