const getGeminiClient = require("./geminiClient");

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

const embedTexts = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
  const cleanTexts = texts.map((text) => text || "");

  if (cleanTexts.length === 0) {
    return [];
  }

  const response = await getGeminiClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: cleanTexts,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  return (response.embeddings || []).map((embedding) => embedding.values || []);
};

const toPgVector = (embedding) => `[${embedding.join(",")}]`;

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  embedTexts,
  toPgVector,
};
