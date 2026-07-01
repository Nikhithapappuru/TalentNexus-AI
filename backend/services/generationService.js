const getGeminiClient = require("./geminiClient");
const { normalizeAiProviderError } = require("../utils/aiProviderError");

const GENERATION_MODEL = process.env.GEMINI_GENERATION_MODEL || "gemini-2.5-flash-lite";

const generateText = async (prompt) => {
  try {
    const response = await getGeminiClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    throw normalizeAiProviderError(error);
  }
};

const generateGroundedAnswer = async ({ question, chunks }) => {
  if (!question) {
    throw new Error("Question is required");
  }

  const context = chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}: ${chunk.original_filename}, chunk ${chunk.chunk_index}]\n${chunk.content}`
    )
    .join("\n\n");

  const prompt = `You are TalentNexus AI, a recruitment assistant.

Answer the user's question using only the provided context.
If the context does not contain enough information, say that the uploaded documents do not provide enough information.
Keep the answer concise and useful.

Context:
${context}

Question:
${question}`;

  return generateText(prompt);
};

module.exports = {
  GENERATION_MODEL,
  generateText,
  generateGroundedAnswer,
};
