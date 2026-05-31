const ai = require('../../../src/integrations/ai-backend');

describe('AI backend', () => {
  test('query returns response content', async () => {
    const mockClient = { apiKey: 'test-key', model: 'glm-4.7-flash' };
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Use async/await for cleaner code.' } }],
      }),
    };
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await ai.query('how to handle async?', { client: mockClient });
    expect(result).toBe('Use async/await for cleaner code.');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({ method: 'POST' }),
    );

    global.fetch = originalFetch;
  });

  test('query uses configured model and max tokens', async () => {
    const mockClient = { apiKey: 'test-key', model: 'glm-4.7-flash' };
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'ok' } }],
      }),
    };
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    await ai.query('test', { client: mockClient, model: 'glm-4v-flash', maxTokens: 500 });
    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.model).toBe('glm-4v-flash');
    expect(callBody.max_tokens).toBe(500);

    global.fetch = originalFetch;
  });

  test('query throws on API error with friendly message', async () => {
    const mockClient = { apiKey: 'test-key', model: 'glm-4.7-flash' };
    const mockResponse = {
      ok: false,
      status: 429,
      text: async () => 'rate limit exceeded',
    };
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    await expect(ai.query('test', { client: mockClient })).rejects.toThrow('AI request failed');

    global.fetch = originalFetch;
  });

  test('createClient returns null when no API key configured', () => {
    const saved = process.env.GLM_API_KEY;
    delete process.env.GLM_API_KEY;
    const client = ai.createClient({ apiKey: '' });
    expect(client).toBeNull();
    process.env.GLM_API_KEY = saved;
  });
});
