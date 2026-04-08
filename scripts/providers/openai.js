'use strict';
const OpenAI = require('openai');

let client;
function getClient() {
  if (!client) {
    const key = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY or CHATGPT_API_KEY not set');
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

async function sendMessage({ model, userContent, maxTokens, temperature }) {
  const params = {
    model,
    max_completion_tokens: maxTokens,
    messages: [{ role: 'user', content: userContent }],
  };
  if (temperature !== undefined && temperature !== null) {
    params.temperature = temperature;
  }
  const resp = await getClient().chat.completions.create(params);
  return {
    text: resp.choices[0].message.content || '',
    inputTokens: resp.usage?.prompt_tokens || 0,
    outputTokens: resp.usage?.completion_tokens || 0,
    stopReason: resp.choices[0].finish_reason,
  };
}

module.exports = { sendMessage };
