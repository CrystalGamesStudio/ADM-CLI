const PROVIDERS = [
  { id: 'glm', name: 'GLM', requiresAuth: true },
  { id: 'openai', name: 'OpenAI', requiresAuth: true },
  { id: 'anthropic', name: 'Anthropic Claude', requiresAuth: true },
  { id: 'ollama', name: 'Ollama (local)', requiresAuth: false },
  { id: 'groq', name: 'Groq', requiresAuth: true },
  { id: 'deepseek', name: 'DeepSeek', requiresAuth: true },
  { id: 'mistral', name: 'Mistral AI', requiresAuth: true },
  { id: 'perplexity', name: 'Perplexity', requiresAuth: true },
  { id: 'openrouter', name: 'OpenRouter', requiresAuth: true },
  { id: 'together', name: 'Together AI', requiresAuth: true },
  { id: 'fireworks', name: 'Fireworks AI', requiresAuth: true },
  { id: 'xai', name: 'Grok (xAI)', requiresAuth: true },
  { id: 'gemini', name: 'Google Gemini', requiresAuth: true },
  { id: 'cohere', name: 'Cohere', requiresAuth: true },
  { id: 'qwen', name: 'Qwen', requiresAuth: true },
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
  if (!apiKey) throw new Error('GLM requires GLM_API_KEY. Set it with /model glm.');

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

function openaiCompatible(baseUrl, defaultModel, providerName) {
  return async function queryOpenaiCompat(prompt, options = {}) {
    const apiKey = options.apiKey;
    if (!apiKey) throw new Error(`${providerName} requires an API key. Set it with /model ${providerName.toLowerCase()}.`);

    const messages = options.messages || [{ role: 'user', content: prompt }];
    const body = {
      model: options.model || defaultModel,
      max_tokens: options.maxTokens || 1024,
      messages,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${providerName} API returned ${res.status}: ${text}`);
    }

    const response = await res.json();
    const choice = response.choices && response.choices[0];
    if (!choice || !choice.message) throw new Error(`${providerName} returned empty response.`);
    return choice.message.content;
  };
}

const queryOpenai = openaiCompatible('https://api.openai.com/v1', 'gpt-4o-mini', 'OpenAI');
const queryGroq = openaiCompatible('https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', 'Groq');
const queryDeepseek = openaiCompatible('https://api.deepseek.com/v1', 'deepseek-chat', 'DeepSeek');
const queryMistral = openaiCompatible('https://api.mistral.ai/v1', 'mistral-large-latest', 'Mistral');
const queryPerplexity = openaiCompatible('https://api.perplexity.ai', 'sonar', 'Perplexity');
const queryOpenrouter = openaiCompatible('https://openrouter.ai/api/v1', 'auto', 'OpenRouter');
const queryTogether = openaiCompatible('https://api.together.xyz/v1', 'meta-llama/Llama-3-70b', 'Together');
const queryFireworks = openaiCompatible('https://api.fireworks.ai/inference/v1', 'llama-v3-70b', 'Fireworks');
const queryXai = openaiCompatible('https://api.x.ai/v1', 'grok-3', 'Grok');
const queryQwen = openaiCompatible('https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen-turbo', 'Qwen');

async function queryGemini(prompt, options = {}) {
  const apiKey = options.apiKey;
  if (!apiKey) throw new Error('Gemini requires an API key. Set it with /model gemini.');

  const model = options.model || 'gemini-2.0-flash';
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  const candidate = response.candidates && response.candidates[0];
  if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
    throw new Error('Gemini returned empty response.');
  }
  return candidate.content.parts[0].text;
}

async function queryCohere(prompt, options = {}) {
  const apiKey = options.apiKey;
  if (!apiKey) throw new Error('Cohere requires an API key. Set it with /model cohere.');

  const messages = options.messages || [{ role: 'user', content: prompt }];
  const body = {
    model: options.model || 'command-r-plus',
    messages,
  };

  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cohere API returned ${res.status}: ${text}`);
  }

  const response = await res.json();
  const content = response.message && response.message.content && response.message.content[0];
  if (!content || content.type !== 'text') throw new Error('Cohere returned empty response.');
  return content.text;
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
  'glm': queryGlmFree,
  'openai': queryOpenai,
  'anthropic': queryAnthropic,
  'ollama': queryOllama,
  'groq': queryGroq,
  'deepseek': queryDeepseek,
  'mistral': queryMistral,
  'perplexity': queryPerplexity,
  'openrouter': queryOpenrouter,
  'together': queryTogether,
  'fireworks': queryFireworks,
  'xai': queryXai,
  'gemini': queryGemini,
  'cohere': queryCohere,
  'qwen': queryQwen,
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
