const PROVIDERS = [
  { id: 'glm-free', name: 'GLM Free', requiresAuth: false },
  { id: 'glm-pro', name: 'GLM Pro', requiresAuth: true },
  { id: 'openai', name: 'OpenAI', requiresAuth: true },
  { id: 'anthropic', name: 'Anthropic Claude', requiresAuth: true },
  { id: 'ollama', name: 'Ollama (local)', requiresAuth: false },
];

const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const GLM_MODELS = ['glm-4.7-flash', 'glm-4-flash', 'glm-z1-flash'];

function listProviders() {
  return PROVIDERS;
}

function getProvider(id) {
  return PROVIDERS.find(p => p.id === id) || null;
}

async function queryGlmFree(prompt, options = {}) {
  const apiKey = options.apiKey || process.env.GLM_API_KEY;
  if (!apiKey) throw new Error('GLM Free requires GLM_API_KEY or default key.');

  const messages = options.messages || [{ role: 'user', content: prompt }];
  const body = {
    model: options.model || GLM_MODELS[0],
    max_tokens: options.maxTokens || 1024,
    messages,
  };

  const res = await fetch(`${GLM_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GLM API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  const choice = response.choices && response.choices[0];
  if (!choice || !choice.message) throw new Error('GLM returned empty response.');
  return choice.message.content;
}

async function queryOpenai(prompt, options = {}) {
  const apiKey = options.apiKey;
  if (!apiKey) throw new Error('OpenAI requires an API key. Set it with /model openai.');

  const messages = options.messages || [{ role: 'user', content: prompt }];
  const body = {
    model: options.model || 'gpt-4o-mini',
    max_tokens: options.maxTokens || 1024,
    messages,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  const choice = response.choices && response.choices[0];
  if (!choice || !choice.message) throw new Error('OpenAI returned empty response.');
  return choice.message.content;
}

async function queryAnthropic(prompt, options = {}) {
  const apiKey = options.apiKey;
  if (!apiKey) throw new Error('Anthropic requires an API key. Set it with /model anthropic.');

  const messages = options.messages || [{ role: 'user', content: prompt }];
  const body = {
    model: options.model || 'claude-sonnet-4-6-20250514',
    max_tokens: options.maxTokens || 1024,
    messages,
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  const block = response.content && response.content[0];
  if (!block || block.type !== 'text') throw new Error('Anthropic returned empty response.');
  return block.text;
}

async function queryOllama(prompt, options = {}) {
  const baseUrl = options.baseUrl || 'http://localhost:11434';
  const messages = options.messages || [{ role: 'user', content: prompt }];
  const body = {
    model: options.model || 'llama3',
    messages,
    stream: false,
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  if (!response.message || !response.message.content) {
    throw new Error('Ollama returned empty response.');
  }
  return response.message.content;
}

const QUERY_MAP = {
  'glm-free': queryGlmFree,
  'glm-pro': queryGlmFree,
  'openai': queryOpenai,
  'anthropic': queryAnthropic,
  'ollama': queryOllama,
};

async function queryWithProvider(providerId, prompt, options = {}) {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const queryFn = QUERY_MAP[providerId];
  if (!queryFn) throw new Error(`Provider ${providerId} not yet implemented`);

  try {
    return await queryFn(prompt, options);
  } catch (err) {
    if (options.fallback && options.fallback !== providerId) {
      const fallbackFn = QUERY_MAP[options.fallback];
      if (fallbackFn) return await fallbackFn(prompt, options);
    }
    throw err;
  }
}

module.exports = { listProviders, getProvider, queryWithProvider };
