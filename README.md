# @rezzedai/voicekeeper

**Detect AI-generated text and verify author voice authenticity.**

```bash
voicekeeper detect draft.md
# { "score": 72, "verdict": "ai", "flags": ["hedging", "transitions"] }

voicekeeper profile reference.txt --name flynn
# { "name": "flynn", "vocabulary": {...}, "sentences": {...} }

voicekeeper match new-post.md --profile flynn.json
# { "similarity": 85, "verdict": "strong_match", "deviations": [] }
```

---

## What It Does

- **AI Detection** — Scans text for 38 AI-generated patterns across 6 categories (hedging, transitions, fluff, politeness, qualifiers, structure)
- **Voice Profiling** — Builds statistical fingerprints from reference text: vocabulary, sentence structure, punctuation habits, distinctive phrases
- **Voice Matching** — Compares new text against profiles using 9 weighted metrics (word length, rarity, phrase overlap, sentence variation)
- **Zero Dependencies** — Pure Node.js, no external runtime dependencies
- **Three Interfaces** — CLI tool, programmatic API, or MCP server for agent workflows

---

## Install

```bash
npm install @rezzedai/voicekeeper
```

**Requirements:** Node.js 18+

---

## Quick Start

### AI Detection

```bash
# From file
voicekeeper detect draft.md

# From stdin
echo "It's important to note that this approach leverages..." | voicekeeper detect -

# From text argument
voicekeeper detect "This innovative solution seamlessly integrates..."

# Pretty output
voicekeeper detect draft.md --pretty
```

**Output:**
```json
{
  "score": 72,
  "verdict": "ai",
  "flags": [
    { "category": "hedging", "count": 3, "patterns": ["it's worth noting"] },
    { "category": "transitions", "count": 2, "patterns": ["moreover"] }
  ],
  "summary": "High confidence AI-generated (72/100). 5 flags across 2 categories."
}
```

**Verdict scale:**
- `human` — score < 30
- `mixed` — score 30-59
- `ai` — score ≥ 60

### Voice Profiling

```bash
voicekeeper profile reference.txt --name flynn

# From multiple files (concatenated)
cat post1.md post2.md | voicekeeper profile - --name flynn > flynn.json
```

**Output:**
```json
{
  "name": "flynn",
  "vocabulary": {
    "uniqueWords": 342,
    "avgWordLength": 4.8,
    "topWords": ["code", "trust", "build"],
    "rarityScore": 0.68
  },
  "sentences": {
    "count": 45,
    "avgLength": 18.2,
    "stdDeviation": 7.3,
    "questionRatio": 0.11
  },
  "punctuation": {
    "commasPerSentence": 1.2,
    "dashesPerSentence": 0.3
  },
  "phrases": {
    "top": [
      { "phrase": "trust scaffold", "count": 5 },
      { "phrase": "earned by structure", "count": 3 }
    ]
  }
}
```

### Voice Matching

```bash
voicekeeper match new-post.md --profile flynn.json --pretty
```

**Output:**
```json
{
  "similarity": 85,
  "verdict": "strong_match",
  "deviations": [
    { "metric": "avgWordLength", "expected": 4.8, "actual": 5.2, "delta": 0.4 }
  ],
  "breakdown": {
    "vocabularyMatch": 82,
    "sentenceStructure": 88,
    "punctuationStyle": 90,
    "phraseOverlap": 78
  }
}
```

**Verdict scale:**
- `strong_match` — similarity ≥ 70
- `partial_match` — similarity 40-69
- `no_match` — similarity < 40

---

## CLI Reference

### Commands

```
voicekeeper detect <file|text|->
  Analyze text for AI-generated patterns.

  Arguments:
    file|text|-  File path, text string, or '-' for stdin

  Options:
    --pretty     Pretty-print JSON output
    -h, --help   Show help

voicekeeper profile <file|->
  Build voice profile from reference text.

  Arguments:
    file|-       File path or '-' for stdin

  Options:
    --name NAME  Profile name (default: "unnamed")
    --pretty     Pretty-print JSON output
    -h, --help   Show help

voicekeeper match <file|text|->
  Compare text against voice profile.

  Arguments:
    file|text|-     File path, text string, or '-' for stdin

  Options:
    --profile FILE  Profile JSON file (required)
    --pretty        Pretty-print JSON output
    -h, --help      Show help
```

### Global Options

```
--pretty   Pretty-print JSON output (4-space indentation)
-h, --help Show command help
```

---

## MCP Tools

voicekeeper runs as an MCP server for integration with agent workflows.

### MCP Configuration

Add to your MCP settings file:

```json
{
  "mcpServers": {
    "voicekeeper": {
      "command": "node",
      "args": ["node_modules/@rezzedai/voicekeeper/dist/mcp.js"]
    }
  }
}
```

Or use npx:

```json
{
  "mcpServers": {
    "voicekeeper": {
      "command": "npx",
      "args": ["-y", "@rezzedai/voicekeeper", "--mcp"]
    }
  }
}
```

### Available Tools

**`detect_ai`**
```typescript
{
  "text": "The text to analyze for AI patterns"
}
// Returns: { score, verdict, flags, summary }
```

**`build_voice_profile`**
```typescript
{
  "text": "Reference text to build profile from",
  "name": "profile-name"  // optional
}
// Returns: { name, vocabulary, sentences, punctuation, phrases }
```

**`match_voice`**
```typescript
{
  "text": "Text to match against profile",
  "profile": { /* VoiceProfile object */ }
}
// Returns: { similarity, verdict, deviations, breakdown }
```

---

## Programmatic API

```typescript
import { detectAI, buildProfile, matchVoice } from '@rezzedai/voicekeeper';
```

### `detectAI(text: string)`

Analyzes text for AI-generated patterns.

```typescript
const result = detectAI("It's important to note that this innovative solution...");
console.log(result);
// {
//   score: 72,
//   verdict: "ai",
//   flags: [
//     { category: "hedging", count: 2, patterns: ["it's important to note"] }
//   ],
//   summary: "High confidence AI-generated (72/100). 2 flags across 1 category."
// }
```

### `buildProfile(text: string, name?: string)`

Builds a statistical voice profile from reference text.

```typescript
const profile = buildProfile(referenceText, "flynn");
console.log(profile);
// {
//   name: "flynn",
//   vocabulary: { uniqueWords: 342, avgWordLength: 4.8, ... },
//   sentences: { count: 45, avgLength: 18.2, ... },
//   punctuation: { commasPerSentence: 1.2, ... },
//   phrases: { top: [{ phrase: "trust scaffold", count: 5 }, ...] }
// }
```

### `matchVoice(text: string, profile: VoiceProfile)`

Compares text against a voice profile.

```typescript
const match = matchVoice(newText, profile);
console.log(match);
// {
//   similarity: 85,
//   verdict: "strong_match",
//   deviations: [
//     { metric: "avgWordLength", expected: 4.8, actual: 5.2, delta: 0.4 }
//   ],
//   breakdown: {
//     vocabularyMatch: 82,
//     sentenceStructure: 88,
//     punctuationStyle: 90,
//     phraseOverlap: 78
//   }
// }
```

---

## How Scoring Works

### AI Detection Algorithm

**Pattern Categories (38 patterns total):**
- Hedging (6 patterns) — "it's worth noting", "one might argue"
- Transitions (8 patterns) — "moreover", "furthermore", "in conclusion"
- Fluff (9 patterns) — "seamlessly", "leverage", "ecosystem"
- Politeness (5 patterns) — "thank you for", "I hope this helps"
- Qualifiers (6 patterns) — "quite", "rather", "fairly"
- Structure (4 patterns) — parenthetical asides, bullet overuse

**Scoring:**
- Each pattern has severity: high (3 points), medium (2 points), low (1 point)
- Base score = sum of (pattern_count × severity)
- Diversity bonus = +10 if flags span 3+ categories
- Capped at 100

**Verdict thresholds:**
- ≥ 60 → `ai` (high confidence AI-generated)
- 30-59 → `mixed` (human with AI assistance or light editing)
- < 30 → `human` (likely human-written)

### Voice Matching Algorithm

**9 Weighted Metrics:**
1. Average word length (10%)
2. Vocabulary rarity (15%) — hapax legomena ratio
3. Top word overlap (10%) — shared frequent words
4. Average sentence length (10%)
5. Sentence length variation (10%) — std deviation
6. Question ratio (5%)
7. Comma density (10%)
8. Dash usage (5%)
9. Phrase overlap (25%) — shared distinctive phrases

**Similarity calculation:**
- Each metric scores 0-100 based on distance from profile baseline
- Weighted average across all metrics
- Final score capped at 100

**Verdict thresholds:**
- ≥ 70 → `strong_match` (highly consistent with profile)
- 40-69 → `partial_match` (some similarities, notable deviations)
- < 40 → `no_match` (inconsistent with profile)

---

| **Package**         | `@rezzedai/voicekeeper`                     |
|---------------------|---------------------------------------------|
| **Version**         | 0.1.0                                       |
| **Runtime**         | Node.js 18+                                 |
| **Dependencies**    | Zero (pure Node.js)                         |
| **Source**          | ~790 lines TypeScript                       |
| **Interfaces**      | CLI, programmatic API, MCP server           |
| **Transport**       | MCP stdio                                   |

---

## Want More?

voicekeeper analyzes one text at a time. [Rezzed Grid-as-a-Service](https://rezzed.ai) runs voice-aware agent teams — where every AI-generated output passes through style matching and authenticity checks automatically.

**What you get with Grid-as-a-Service:**
- Multi-agent workflows with built-in voice verification
- Continuous profiling across all generated content
- Real-time deviation alerts when outputs drift from brand voice
- Pre-configured voice profiles for technical writing, marketing, documentation
- Integration with existing content pipelines via API and webhooks

Learn more at [rezzed.ai](https://rezzed.ai).

---

## License

MIT

---

Built by [Rezzed](https://rezzed.ai) — the AI product studio.
