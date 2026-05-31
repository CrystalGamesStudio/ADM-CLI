const ai = require('../../../src/integrations/ai-backend');

describe('AI backend', () => {
  test('query returns response content', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Use async/await for cleaner code.' }],
        }),
      },
    };
    const result = await ai.query('how to handle async?', { client: mockClient });
    expect(result).toBe('Use async/await for cleaner code.');
    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'how to handle async?' }],
      }),
    );
  });

  test('query uses configured model and max tokens', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'ok' }],
        }),
      },
    };
    await ai.query('test', { client: mockClient, model: 'claude-haiku-4-5-20251001', maxTokens: 500 });
    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
      }),
    );
  });

  test('query throws on API error with friendly message', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API rate limit exceeded')),
      },
    };
    await expect(ai.query('test', { client: mockClient })).rejects.toThrow('rate limit');
  });

  test('createClient returns null when no API key configured', () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const client = ai.createClient({ apiKey: '' });
    expect(client).toBeNull();
    process.env.ANTHROPIC_API_KEY = saved;
  });
});
