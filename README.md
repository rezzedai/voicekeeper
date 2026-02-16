# Your writing sounds like ChatGPT. Here's the proof.

**Before:**
> It's important to note that this innovative solution seamlessly leverages cutting-edge technology. Moreover, the ecosystem enables stakeholders to unlock unprecedented value.

```
Score: 87/100 — AI
Flags: "important to note" (hedging), "Moreover" (transition),
       "seamlessly" (fluff), "leverages" (fluff), "unprecedented" (fluff)
```

**After you fix the flags:**
> This tool catches the vocabulary, transitions, and hedging that make your writing sound machine-generated. Paste a paragraph, get a score, fix what it finds.

```
Score: 11/100 — Human
Flags: none
```

Same idea. Zero AI fingerprint. That's Voicekeeper.

---

## The problem

54% of LinkedIn posts are AI-generated. They get 45% less engagement.

Your grammar isn't the problem. Your vocabulary is. Every "leverage," "moreover," and "it's important to note" tells the reader this was written by a chatbot. Not because those words are wrong. Because they've read that exact sentence 400 times today.

---

## Try it free — no install

**[My Voice Proofreader](https://chatgpt.com/g/g-69936f8589788191b347117e4d74f354-my-voice-proofreader)** — a free Custom GPT that scans your text for AI writing patterns and strips them out. Paste your text, get your score, fix the flags. No account, no npm, no config.

Or from your terminal:

```bash
npx @rezzedai/voicekeeper detect "Your text here"
```

No setup. No account. No config.

---

## Three tools, one library

| Tool | What it does |
|------|-------------|
| **detect** | Scans for 38 AI patterns across 6 categories. Scores 0–100. |
| **profile** | Builds a statistical fingerprint of your writing style. |
| **match** | Compares new text against your profile. Catches drift. |

---

## Install

```bash
npm install @rezzedai/voicekeeper
```

Or just use `npx` — no install required.

---

## Use it

### Command line

```bash
voicekeeper detect draft.md
voicekeeper profile my-writing.txt --name me
voicekeeper match new-post.md --profile me.json
```

Pipe from stdin with `-`. Add `--pretty` for formatted output.

### Code

```typescript
import { detectAI, buildProfile, matchVoice } from '@rezzedai/voicekeeper';

const result = detectAI(text);        // → { score, verdict, flags }
const profile = buildProfile(text);   // → voice fingerprint
const match = matchVoice(text, profile); // → { similarity, verdict }
```

### Claude / MCP

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

Paste that into your MCP config. Three tools appear: `detect_ai`, `build_voice_profile`, `match_voice`.

---

## Scoring

**AI Detection** — 38 patterns, 6 categories: hedging, transitions, fluff, politeness, qualifiers, structure. Each pattern has a severity weight. Score hits 100, it's a robot.

| Score | Verdict |
|-------|---------|
| < 30 | `human` |
| 30–59 | `mixed` |
| ≥ 60 | `ai` |

**Voice Match** — 9 metrics (vocabulary, sentence structure, punctuation, phrase overlap). Weighted similarity score.

| Score | Verdict |
|-------|---------|
| ≥ 70 | `strong_match` |
| 40–69 | `partial_match` |
| < 40 | `no_match` |

---

Zero dependencies. ~790 lines of TypeScript. Node 18+. MIT licensed.

Built by [Rezzed](https://rezzed.ai).
