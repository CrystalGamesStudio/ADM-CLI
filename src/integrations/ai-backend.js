const Anthropic = require('@anthropic-ai/sdk');

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

function createClient({ apiKey } = {}) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function query(prompt, options = {}) {
  const client = options.client || createClient({ apiKey: options.apiKey });
  if (!client) throw new Error('AI not configured. Set ANTHROPIC_API_KEY or run `adm setup`.');

  try {
    const response = await client.messages.create({
      model: options.model || DEFAULT_MODEL,
      max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('rate limit')) throw new Error(`AI rate limit hit. Please wait and try again. (${msg})`);
    if (msg.includes('auth') || msg.includes('api_key')) throw new Error(`AI authentication failed. Check your API key. (${msg})`);
    throw new Error(`AI request failed: ${msg}`);
  }
}

module.exports = { createClient, query };
