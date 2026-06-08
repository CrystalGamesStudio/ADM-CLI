const { createRegistry } = require('../../../../src/tui/commands/registry');

describe('/model command', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry({ theme: { current: 'dark' } });
  });

  test('/model list shows all 5 providers', async () => {
    const result = await registry.dispatch('model list');
    expect(result.output).toContain('glm');
    expect(result.output).toContain('GLM');
    expect(result.output).toContain('openai');
    expect(result.output).toContain('OpenAI');
    expect(result.output).toContain('anthropic');
    expect(result.output).toContain('Anthropic Claude');
    expect(result.output).toContain('ollama');
    expect(result.output).toContain('Ollama');
  });

  test('/model without args shows current provider', async () => {
    const result = await registry.dispatch('model');
    expect(result.output).toContain('Current');
    expect(result.output).toContain('glm');
  });

  test('/model glm without key returns shouldPromptModelToken', async () => {
    const result = await registry.dispatch('model glm');
    expect(result.shouldPromptModelToken).toBe(true);
    expect(result.modelProvider).toBe('glm');
  });

  test('/model openai returns shouldPromptModelToken when no key stored', async () => {
    const result = await registry.dispatch('model openai');
    expect(result.shouldPromptModelToken).toBe(true);
    expect(result.modelProvider).toBe('openai');
  });

  test('/model anthropic returns shouldPromptModelToken when no key stored', async () => {
    const result = await registry.dispatch('model anthropic');
    expect(result.shouldPromptModelToken).toBe(true);
    expect(result.modelProvider).toBe('anthropic');
  });

  test('/model ollama sets provider and shows URL info', async () => {
    const result = await registry.dispatch('model ollama');
    expect(result.output).toMatch(/ollama/i);
    expect(result.output).toMatch(/localhost/i);
  });

  test('/model with unknown provider shows error', async () => {
    const result = await registry.dispatch('model nonexistent');
    expect(result.output).toMatch(/unknown/i);
  });
});
