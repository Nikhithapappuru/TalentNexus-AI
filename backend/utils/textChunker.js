const chunkText = (text, maxWords = 220, overlapWords = 40) => {
  if (!text || !text.trim()) {
    return [];
  }

  const words = text.trim().split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const content = words.slice(start, end).join(" ");

    if (content.trim()) {
      chunks.push({
        content,
        tokenCount: content.split(/\s+/).length,
      });
    }

    if (end === words.length) {
      break;
    }

    start = Math.max(end - overlapWords, start + 1);
  }

  return chunks;
};

module.exports = chunkText;
