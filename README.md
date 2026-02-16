# Voicekeeper

AI leaves fingerprints. This finds them.

---

## Try it now

```bash
npx @rezzedai/voicekeeper detect "Your text here"
```

No setup. No account. No config.

---

## Before & After

**Input:**
> It's important to note that this innovative solution seamlessly leverages cutting-edge technology. Moreover, the ecosystem enables stakeholders to unlock unprecedented value.

**Output:**
```
Score: 87/100 — ai
5 flags: hedging, transitions, fluff (×3)
```

That paragraph scored 87. Every red flag identified. Now you know exactly what to fix.

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
