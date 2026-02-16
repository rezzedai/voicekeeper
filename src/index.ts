export { detectAI } from "./analyzers/ai-detector";
export { buildProfile } from "./analyzers/voice-profiler";
export { matchVoice } from "./analyzers/voice-matcher";

export type {
  AIDetectionResult,
  AIFlag,
  VoiceProfile,
  VocabStats,
  SentenceStats,
  PunctuationStats,
  VoiceMatchResult,
  VoiceDeviation,
} from "./types";
