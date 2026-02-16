import { AI_PATTERNS, CATEGORIES, type PatternCategory } from "../patterns/ai-patterns";
import type { AIDetectionResult, AIFlag } from "../types";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function detectAI(text: string): AIDetectionResult {
  const wordCount = countWords(text);
  if (wordCount < 10) {
    return {
      score: 0,
      verdict: "human",
      flags: [],
      summary: "Text too short for meaningful analysis.",
    };
  }

  const flags: AIFlag[] = [];
  const categoryHits: Record<string, number> = {};

  for (const category of CATEGORIES) {
    categoryHits[category] = 0;
  }

  for (const entry of AI_PATTERNS) {
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    // Reset regex state
    entry.pattern.lastIndex = 0;

    while ((match = entry.pattern.exec(text)) !== null) {
      matches.push(match[0]);
      // Safety: prevent infinite loops on zero-length matches
      if (match.index === entry.pattern.lastIndex) {
        entry.pattern.lastIndex++;
      }
    }

    if (matches.length > 0) {
      flags.push({
        pattern: entry.label,
        category: entry.category,
        matches,
        severity: entry.severity,
      });
      categoryHits[entry.category] = (categoryHits[entry.category] ?? 0) + matches.length;
    }
  }

  // Score calculation
  // Weight: high severity = 3, medium = 2, low = 1
  // Normalize by word count to handle different text lengths
  let rawScore = 0;
  for (const flag of flags) {
    const weight = flag.severity === "high" ? 3 : flag.severity === "medium" ? 2 : 1;
    rawScore += flag.matches.length * weight;
  }

  // Density-based scoring: patterns per 100 words
  const density = (rawScore / wordCount) * 100;

  // Map density to 0-100 score
  // 0 density = 0 score, 5+ density = ~100 score
  const score = Math.min(100, Math.round(density * 20));

  // Category diversity bonus: hitting many categories is more AI-like
  const activeCats = Object.values(categoryHits).filter((n) => n > 0).length;
  const diversityBonus = activeCats >= 4 ? 10 : activeCats >= 3 ? 5 : 0;
  const finalScore = Math.min(100, score + diversityBonus);

  // Verdict
  let verdict: "human" | "mixed" | "ai";
  if (finalScore >= 60) {
    verdict = "ai";
  } else if (finalScore >= 30) {
    verdict = "mixed";
  } else {
    verdict = "human";
  }

  // Summary
  const topCategories = Object.entries(categoryHits)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  let summary: string;
  if (verdict === "human") {
    summary = `Low AI signal (${finalScore}/100). Text appears human-written.`;
  } else if (verdict === "mixed") {
    summary = `Mixed signals (${finalScore}/100). Some AI patterns detected in: ${topCategories.join(", ")}.`;
  } else {
    summary = `Strong AI signal (${finalScore}/100). Heavy pattern density in: ${topCategories.join(", ")}.`;
  }

  return { score: finalScore, verdict, flags, summary };
}
