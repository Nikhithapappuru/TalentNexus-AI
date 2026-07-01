const getGeminiClient = require("./geminiClient");
const { normalizeAiProviderError } = require("../utils/aiProviderError");

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

const embedTexts = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
  const cleanTexts = texts.map((text) => text || "");

  if (cleanTexts.length === 0) {
    return [];
  }

  let response;

  try {
    response = await getGeminiClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: cleanTexts,
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });
  } catch (error) {
    throw normalizeAiProviderError(error);
  }

  return (response.embeddings || []).map((embedding) => embedding.values || []);
};

const toPgVector = (embedding) => `[${embedding.join(",")}]`;

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  embedTexts,
  toPgVector,
};
