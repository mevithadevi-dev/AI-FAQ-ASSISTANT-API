const { GoogleGenAI } = require('@google/genai');

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }
  return new GoogleGenAI({ apiKey });
};

const generateContentWithRetry = async (ai, request) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      const statusCodes = [error.status, error.code, error.response?.status]
        .map(Number)
        .filter(Number.isInteger);
      const temporaryFailure = statusCodes.some((status) => status === 429 || status === 503)
        || /\"code\"\s*:\s*(429|503)|RESOURCE_EXHAUSTED|UNAVAILABLE/.test(error.message || '');

      if (!temporaryFailure || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};

const generateAnswer = async (question) => {
  const ai = getClient();
  const response = await generateContentWithRetry(ai, {
    model: 'gemini-3.5-flash-lite',
    contents: question,
  });
  return response.text;
};

module.exports = { generateAnswer };