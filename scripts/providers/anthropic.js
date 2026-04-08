'use strict';
const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    client = new Anthropic();
  }
  return client;
}

async function sendMessage({ model, userContent, maxTokens, temperature }) {
  const params = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: userContent }],
  };
  if (temperature !== undefined && temperature !== null) {
    params.temperature = temperature;
  }
  const msg = await getClient().messages.create(params);
  return {
    text: msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n'),
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    stopReason: msg.stop_reason,
  };
}

module.exports = { sendMessage };
