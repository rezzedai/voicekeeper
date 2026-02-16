// --- AI Detection ---

export interface AIDetectionResult {
  score: number;
  verdict: "human" | "mixed" | "ai";
  flags: AIFlag[];
  summary: string;
}

export interface AIFlag {
  pattern: string;
  category: string;
  matches: string[];
  severity: "low" | "medium" | "high";
}

// --- Voice Profile ---

export interface VoiceProfile {
  name: string;
  sourceLength: number;
  vocabulary: VocabStats;
  sentences: SentenceStats;
  punctuation: PunctuationStats;
  phrases: string[];
  createdAt: string;
}

export interface VocabStats {
  uniqueWords: number;
  totalWords: number;
  avgWordLength: number;
  topWords: [string, number][];
  rarityScore: number;
}

export interface SentenceStats {
  count: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  stdDevLength: number;
  questionRatio: number;
  exclamationRatio: number;
}

export interface PunctuationStats {
  commasPerSentence: number;
  semicolonsPerSentence: number;
  dashesPerSentence: number;
  ellipsesCount: number;
  parenthesesCount: number;
}

// --- Voice Matching ---

export interface VoiceMatchResult {
  similarity: number;
  verdict: "strong_match" | "partial_match" | "no_match";
  deviations: VoiceDeviation[];
  summary: string;
}

export interface VoiceDeviation {
  aspect: string;
  expected: string;
  actual: string;
  severity: "minor" | "notable" | "major";
}
