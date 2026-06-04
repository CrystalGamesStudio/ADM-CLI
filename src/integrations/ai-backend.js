const FLASH_MODELS = ['glm-4.7-flash', 'glm-4-flash', 'glm-z1-flash'];
const DEFAULT_MAX_TOKENS = 1024;
const API_BASE = 'https://open.bigmodel.cn/api/paas/v4';

function createClient({ apiKey } = {}) {
  const key = apiKey || process.env.GLM_API_KEY;
  if (!key) return null;
  return { apiKey: key, model: FLASH_MODELS[0] };
}

async function query(prompt, options = {}) {
  const client = options.client || createClient({ apiKey: options.apiKey });
  if (!client) throw new Error('AI not configured. Set GLM_API_KEY or run `adm setup`.');

  const models = options.model ? [options.model] : FLASH_MODELS;
  let lastError;

  for (const model of models) {
    const body = {
      model,
      max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      messages: options.messages || [{ role: 'user', content: prompt }],
    };

    try {
      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 429 && models.indexOf(model) < models.length - 1) {
          lastError = text;
          continue;
        }
        throw new Error(`API returned ${res.status}: ${text}`);
      }

      const response = await res.json();
      const choice = response.choices && response.choices[0];
      if (!choice || !choice.message) throw new Error('AI returned empty response.');
      return choice.message.content;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('auth')) {
        throw new Error(`AI authentication failed. Check your API key. (${msg})`);
      }
      lastError = msg;
    }
  }

  throw new Error(`AI request failed (all models tried): ${lastError}`);
}

module.exports = { createClient, query };
