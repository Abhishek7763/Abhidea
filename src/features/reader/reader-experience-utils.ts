export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function splitSpeechText(text: string, maxLength = 240): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const sentences = normalized.match(/[^.!?।]+[.!?।]?/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";

  function pushCurrent() {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  }

  for (const sentenceValue of sentences) {
    let sentence = sentenceValue.trim();
    if (!sentence) continue;

    if (sentence.length > maxLength) {
      pushCurrent();
      const words = sentence.split(" ");
      let wordChunk = "";

      for (const word of words) {
        if (!wordChunk) {
          wordChunk = word;
          continue;
        }

        if (`${wordChunk} ${word}`.length <= maxLength) {
          wordChunk += ` ${word}`;
        } else {
          chunks.push(wordChunk);
          wordChunk = word;
        }
      }

      if (wordChunk) chunks.push(wordChunk);
      continue;
    }

    if (!current) {
      current = sentence;
    } else if (`${current} ${sentence}`.length <= maxLength) {
      current += ` ${sentence}`;
    } else {
      pushCurrent();
      current = sentence;
    }
  }

  pushCurrent();
  return chunks;
}
