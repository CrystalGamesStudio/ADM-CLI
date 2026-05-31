const aiCommand = require('../../../../src/repl/commands/ai');

describe('ai command', () => {
  test('sends question to AI and returns response', async () => {
    const mockAi = {
      query: jest.fn().mockResolvedValue('Use async/await for cleaner code.'),
    };
    const result = await aiCommand.execute('how to handle async?', { ai: mockAi });
    expect(result.shouldExit).toBe(false);
    expect(result.output).toContain('Use async/await for cleaner code.');
    expect(mockAi.query).toHaveBeenCalledWith('how to handle async?', expect.any(Object));
  });

  test('shows error when AI not configured', async () => {
    const result = await aiCommand.execute('test', { ai: null });
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/not configured/i);
  });

  test('shows error when AI query fails', async () => {
    const mockAi = {
      query: jest.fn().mockRejectedValue(new Error('rate limit exceeded')),
    };
    const result = await aiCommand.execute('test', { ai: mockAi });
    expect(result.shouldExit).toBe(false);
    expect(result.output).toMatch(/rate limit/i);
  });
});
