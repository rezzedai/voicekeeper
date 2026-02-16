import type { VoiceProfile, VocabStats, SentenceStats, PunctuationStats } from "../types";

// Common English stop words to exclude from vocabulary analysis
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "this", "that",
  "these", "those", "i", "you", "he", "she", "it", "we", "they", "me",
  "him", "her", "us", "them", "my", "your", "his", "its", "our", "their",
  "what", "which", "who", "whom", "where", "when", "why", "how", "not",
  "no", "if", "then", "than", "so", "as", "just", "about", "up", "out",
  "into", "over", "after", "before", "between", "under", "through",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function buildVocabStats(words: string[]): VocabStats {
  const freq = new Map<string, number>();
  const contentWords: string[] = [];

  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      contentWords.push(word);
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const totalContentWords = contentWords.length;
  const uniqueWords = freq.size;

  // Rarity score: ratio of words used only once (hapax legomena)
  const hapax = sorted.filter(([, count]) => count === 1).length;
  const rarityScore = uniqueWords > 0 ? Math.round((hapax / uniqueWords) * 100) : 0;

  const avgWordLength =
    contentWords.length > 0
      ? Math.round((contentWords.reduce((sum, w) => sum + w.length, 0) / contentWords.length) * 10) / 10
      : 0;

  return {
    uniqueWords,
    totalWords: totalContentWords,
    avgWordLength,
    topWords: sorted.slice(0, 20) as [string, number][],
    rarityScore,
  };
}

function buildSentenceStats(sentences: string[]): SentenceStats {
  if (sentences.length === 0) {
    return { count: 0, avgLength: 0, minLength: 0, maxLength: 0, stdDevLength: 0, questionRatio: 0, exclamationRatio: 0 };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const questions = sentences.filter((s) => s.endsWith("?")).length;
  const exclamations = sentences.filter((s) => s.endsWith("!")).length;

  return {
    count: sentences.length,
    avgLength: Math.round(avg * 10) / 10,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    stdDevLength: Math.round(stdDev(lengths, avg) * 10) / 10,
    questionRatio: Math.round((questions / sentences.length) * 100) / 100,
    exclamationRatio: Math.round((exclamations / sentences.length) * 100) / 100,
  };
}

function buildPunctuationStats(text: string, sentenceCount: number): PunctuationStats {
  const sc = sentenceCount || 1;
  return {
    commasPerSentence: Math.round(((text.match(/,/g) ?? []).length / sc) * 10) / 10,
    semicolonsPerSentence: Math.round(((text.match(/;/g) ?? []).length / sc) * 10) / 10,
    dashesPerSentence: Math.round(((text.match(/[—–-]{1,2}/g) ?? []).length / sc) * 10) / 10,
    ellipsesCount: (text.match(/\.{3}|…/g) ?? []).length,
    parenthesesCount: (text.match(/\(/g) ?? []).length,
  };
}

export function buildProfile(text: string, name: string): VoiceProfile {
  const words = tokenize(text);
  const sentences = splitSentences(text);

  return {
    name,
    sourceLength: text.length,
    vocabulary: buildVocabStats(words),
    sentences: buildSentenceStats(sentences),
    punctuation: buildPunctuationStats(text, sentences.length),
    phrases: extractDistinctivePhrases(text),
    createdAt: new Date().toISOString(),
  };
}

function extractDistinctivePhrases(text: string): string[] {
  // Extract 2-4 word phrases that appear multiple times
  const words = text.toLowerCase().split(/\s+/);
  const phrases = new Map<string, number>();

  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      // Skip if mostly stop words
      const contentCount = phrase.split(" ").filter((w) => !STOP_WORDS.has(w)).length;
      if (contentCount >= Math.ceil(n / 2)) {
        phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
      }
    }
  }

  return [...phrases.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase]) => phrase);
}
