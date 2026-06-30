const { GoogleGenAI } = require("@google/genai");

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

let client;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return client;
};

const embedTexts = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
  const cleanTexts = texts.map((text) => text || "");

  if (cleanTexts.length === 0) {
    return [];
  }

  const response = await getClient().models.embedContent({
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
