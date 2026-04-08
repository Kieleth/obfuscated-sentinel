'use strict';
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
function getClient() {
  if (!genAI) {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set');
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

async function sendMessage({ model, userContent, maxTokens, temperature }) {
  const config = { maxOutputTokens: maxTokens };
  if (temperature !== undefined && temperature !== null) {
    config.temperature = temperature;
  }
  const genModel = getClient().getGenerativeModel({ model, generationConfig: config });
  const result = await genModel.generateContent(userContent);
  const resp = result.response;
  return {
    text: resp.text(),
    inputTokens: resp.usageMetadata?.promptTokenCount || 0,
    outputTokens: resp.usageMetadata?.candidatesTokenCount || 0,
    stopReason: resp.candidates?.[0]?.finishReason || 'unknown',
  };
}

module.exports = { sendMessage };
