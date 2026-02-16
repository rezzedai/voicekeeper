import type { VoiceProfile, VoiceMatchResult, VoiceDeviation } from "../types";
import { buildProfile } from "./voice-profiler";

function compareStat(label: string, expected: number, actual: number, tolerance: number): VoiceDeviation | null {
  const diff = Math.abs(expected - actual);
  if (diff <= tolerance) return null;

  const severity = diff > tolerance * 3 ? "major" : diff > tolerance * 1.5 ? "notable" : "minor";

  return {
    aspect: label,
    expected: String(expected),
    actual: String(actual),
    severity,
  };
}

export function matchVoice(text: string, profile: VoiceProfile): VoiceMatchResult {
  const candidate = buildProfile(text, "candidate");
  const deviations: VoiceDeviation[] = [];
  const scores: number[] = [];

  // 1. Vocabulary comparison (weight: 25%)
  const vocabExpected = profile.vocabulary;
  const vocabActual = candidate.vocabulary;

  // Average word length
  const wlDev = compareStat("Avg word length", vocabExpected.avgWordLength, vocabActual.avgWordLength, 0.5);
  if (wlDev) deviations.push(wlDev);
  const wlScore = Math.max(0, 100 - Math.abs(vocabExpected.avgWordLength - vocabActual.avgWordLength) * 20);
  scores.push(wlScore);

  // Rarity score
  const rareDev = compareStat("Vocabulary rarity", vocabExpected.rarityScore, vocabActual.rarityScore, 10);
  if (rareDev) deviations.push(rareDev);
  const rareScore = Math.max(0, 100 - Math.abs(vocabExpected.rarityScore - vocabActual.rarityScore) * 2);
  scores.push(rareScore);

  // Shared top words
  const profileTopSet = new Set(vocabExpected.topWords.slice(0, 15).map(([w]) => w));
  const candidateTopSet = new Set(vocabActual.topWords.slice(0, 15).map(([w]) => w));
  let sharedTop = 0;
  for (const w of profileTopSet) {
    if (candidateTopSet.has(w)) sharedTop++;
  }
  const overlapSize = Math.max(profileTopSet.size, candidateTopSet.size) || 1;
  const overlapScore = Math.round((sharedTop / overlapSize) * 100);
  scores.push(overlapScore);

  // 2. Sentence structure comparison (weight: 30%)
  const sentExpected = profile.sentences;
  const sentActual = candidate.sentences;

  const avgLenDev = compareStat("Avg sentence length", sentExpected.avgLength, sentActual.avgLength, 3);
  if (avgLenDev) deviations.push(avgLenDev);
  const avgLenScore = Math.max(0, 100 - Math.abs(sentExpected.avgLength - sentActual.avgLength) * 5);
  scores.push(avgLenScore);

  const stdDevDev = compareStat("Sentence length variation", sentExpected.stdDevLength, sentActual.stdDevLength, 3);
  if (stdDevDev) deviations.push(stdDevDev);
  const stdScore = Math.max(0, 100 - Math.abs(sentExpected.stdDevLength - sentActual.stdDevLength) * 5);
  scores.push(stdScore);

  const qDev = compareStat("Question ratio", sentExpected.questionRatio, sentActual.questionRatio, 0.1);
  if (qDev) deviations.push(qDev);
  const qScore = Math.max(0, 100 - Math.abs(sentExpected.questionRatio - sentActual.questionRatio) * 200);
  scores.push(qScore);

  // 3. Punctuation comparison (weight: 20%)
  const puncExpected = profile.punctuation;
  const puncActual = candidate.punctuation;

  const commaDev = compareStat("Commas per sentence", puncExpected.commasPerSentence, puncActual.commasPerSentence, 0.5);
  if (commaDev) deviations.push(commaDev);
  const commaScore = Math.max(0, 100 - Math.abs(puncExpected.commasPerSentence - puncActual.commasPerSentence) * 30);
  scores.push(commaScore);

  const dashDev = compareStat("Dashes per sentence", puncExpected.dashesPerSentence, puncActual.dashesPerSentence, 0.3);
  if (dashDev) deviations.push(dashDev);
  const dashScore = Math.max(0, 100 - Math.abs(puncExpected.dashesPerSentence - puncActual.dashesPerSentence) * 40);
  scores.push(dashScore);

  // 4. Phrase overlap (weight: 25%)
  const profilePhrases = new Set(profile.phrases);
  let phraseMatches = 0;
  for (const phrase of candidate.phrases) {
    if (profilePhrases.has(phrase)) phraseMatches++;
  }
  const phraseBase = Math.max(profilePhrases.size, 1);
  const phraseScore = Math.round((phraseMatches / phraseBase) * 100);
  scores.push(phraseScore);

  // Weighted average
  const weights = [0.08, 0.08, 0.09, 0.12, 0.1, 0.08, 0.1, 0.1, 0.25];
  let similarity = 0;
  for (let i = 0; i < scores.length; i++) {
    similarity += (scores[i] ?? 0) * (weights[i] ?? 0);
  }
  similarity = Math.round(similarity);

  // Verdict
  let verdict: "strong_match" | "partial_match" | "no_match";
  if (similarity >= 70) {
    verdict = "strong_match";
  } else if (similarity >= 40) {
    verdict = "partial_match";
  } else {
    verdict = "no_match";
  }

  const majorCount = deviations.filter((d) => d.severity === "major").length;
  const summary =
    verdict === "strong_match"
      ? `Strong voice match (${similarity}/100). Writing style closely matches "${profile.name}".`
      : verdict === "partial_match"
        ? `Partial voice match (${similarity}/100). ${majorCount} major deviations from "${profile.name}" style.`
        : `No voice match (${similarity}/100). Writing style differs significantly from "${profile.name}".`;

  return { similarity, verdict, deviations, summary };
}
