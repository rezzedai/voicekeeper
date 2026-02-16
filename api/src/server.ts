import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as fs from "fs";
import * as path from "path";
import { timingSafeEqual as cryptoTimingSafeEqual } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const voicekeeper = require("../../dist/index.js");

const detectAI: (text: string) => {
  score: number;
  verdict: string;
  flags: Array<{ pattern: string; category: string; matches: string[]; severity: string }>;
  summary: string;
} = voicekeeper.detectAI;

const buildProfile: (text: string, name: string) => {
  name: string;
  sourceLength: number;
  vocabulary: {
    uniqueWords: number;
    totalWords: number;
    avgWordLength: number;
    topWords: [string, number][];
    rarityScore: number;
  };
  sentences: {
    count: number;
    avgLength: number;
    minLength: number;
    maxLength: number;
    stdDevLength: number;
    questionRatio: number;
    exclamationRatio: number;
  };
  punctuation: {
    commasPerSentence: number;
    semicolonsPerSentence: number;
    dashesPerSentence: number;
    ellipsesCount: number;
    parenthesesCount: number;
  };
  phrases: string[];
  createdAt: string;
} = voicekeeper.buildProfile;

const matchVoice: (text: string, profile: unknown) => {
  similarity: number;
  verdict: string;
  deviations: Array<{ aspect: string; expected: string; actual: string; severity: string }>;
  summary: string;
} = voicekeeper.matchVoice;

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.VOICEKEEPER_API_KEY;

// Constant-time comparison helper
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return cryptoTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// API Key Authentication Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) {
    // No key configured — reject all (fail closed)
    return res.status(503).json({ error: "Service not configured" });
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(token, API_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Profile validation helper
function validateProfile(profile: unknown): string | null {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return "Missing or invalid 'profile' field";
  }
  const p = profile as Record<string, unknown>;

  // Required string fields
  if (typeof p.name !== "string") return "Profile missing 'name' (string)";
  if (typeof p.createdAt !== "string") return "Profile missing 'createdAt' (string)";

  // Required number fields
  if (typeof p.sourceLength !== "number") return "Profile missing 'sourceLength' (number)";

  // Vocabulary sub-object
  if (!p.vocabulary || typeof p.vocabulary !== "object") return "Profile missing 'vocabulary' (object)";
  const v = p.vocabulary as Record<string, unknown>;
  if (typeof v.uniqueWords !== "number") return "Profile.vocabulary missing 'uniqueWords'";
  if (typeof v.totalWords !== "number") return "Profile.vocabulary missing 'totalWords'";
  if (typeof v.avgWordLength !== "number") return "Profile.vocabulary missing 'avgWordLength'";
  if (typeof v.rarityScore !== "number") return "Profile.vocabulary missing 'rarityScore'";
  if (!Array.isArray(v.topWords)) return "Profile.vocabulary missing 'topWords' (array)";

  // Sentences sub-object
  if (!p.sentences || typeof p.sentences !== "object") return "Profile missing 'sentences' (object)";
  const s = p.sentences as Record<string, unknown>;
  if (typeof s.count !== "number") return "Profile.sentences missing 'count'";
  if (typeof s.avgLength !== "number") return "Profile.sentences missing 'avgLength'";

  // Punctuation sub-object
  if (!p.punctuation || typeof p.punctuation !== "object") return "Profile missing 'punctuation' (object)";
  const punc = p.punctuation as Record<string, unknown>;
  if (typeof punc.commasPerSentence !== "number") return "Profile.punctuation missing 'commasPerSentence'";

  // Phrases array
  if (!Array.isArray(p.phrases)) return "Profile missing 'phrases' (array)";

  return null; // valid
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health endpoint (unauthenticated)
app.get("/v1/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "0.1.0" });
});

// Detect AI endpoint (authenticated)
app.post("/v1/detect", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: "Text must be at least 50 characters" });
    }

    if (text.length > 50000) {
      return res.status(413).json({ error: "Text exceeds maximum length of 50,000 characters" });
    }

    const result = detectAI(text);

    res.json({
      aiScore: result.score,
      verdict: result.verdict,
      patterns: result.flags.map(f => ({
        pattern: f.pattern,
        category: f.category,
        matches: f.matches,
        severity: f.severity,
      })),
      flaggedSentences: [...new Set(result.flags.flatMap(f => f.matches))],
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
});

// Proofread endpoint (authenticated)
app.post("/v1/proofread", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: "Text must be at least 50 characters" });
    }

    if (text.length > 50000) {
      return res.status(413).json({ error: "Text exceeds maximum length of 50,000 characters" });
    }

    // Fluff replacement map
    const fluffMap: Record<string, string> = {
      leverage: "use",
      utilize: "use",
      facilitate: "help",
      implement: "build",
      ensure: "make sure",
      robust: "strong",
      optimize: "improve",
      streamline: "simplify",
      holistic: "complete",
      delve: "dig",
      seamless: "smooth",
      seamlessly: "smoothly",
      tapestry: "",
    };

    // Get before score
    const before = detectAI(text);
    let cleaned = text;
    const removedPatterns: string[] = [];

    // Process each flag
    for (const flag of before.flags) {
      for (const match of flag.matches) {
        const escaped = match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        if (flag.category === "fluff") {
          // Try direct lookup for single-word replacements
          const lowerMatch = match.toLowerCase();
          const replacement = fluffMap[lowerMatch];
          if (replacement !== undefined) {
            const regex = new RegExp(escaped, "gi");
            cleaned = cleaned.replace(regex, (matched) => {
              if (!replacement) return "";
              if (matched[0] === matched[0].toUpperCase()) {
                return replacement.charAt(0).toUpperCase() + replacement.slice(1);
              }
              return replacement;
            });
          } else {
            // Multi-word fluff match — remove entirely
            const regex = new RegExp(escaped, "gi");
            cleaned = cleaned.replace(regex, "");
          }
          removedPatterns.push(flag.pattern);
        } else if (["hedging", "politeness", "qualifiers"].includes(flag.category)) {
          // Remove the entire matched phrase
          const regex = new RegExp(escaped, "gi");
          cleaned = cleaned.replace(regex, "");
          removedPatterns.push(flag.pattern);
        } else if (flag.category === "transitions") {
          // Remove transition word plus trailing comma and space
          const regex = new RegExp(`${escaped},?\\s*`, "gi");
          cleaned = cleaned.replace(regex, "");
          removedPatterns.push(flag.pattern);
        }
        // structure category: leave as-is
      }
    }

    // Clean up the text
    cleaned = cleaned
      .replace(/ {2,}/g, " ") // Collapse multiple spaces (preserve newlines)
      .replace(/ ,/g, ",") // Fix space before comma
      .replace(/ \./g, ".") // Fix space before period
      .replace(/,{2,}/g, ",") // Collapse multiple commas
      .replace(/^\s+/gm, "") // Remove leading whitespace on lines
      .replace(/\.\s*\./g, ".") // Fix orphaned periods
      .replace(/,\s*\./g, ".") // Fix comma-period
      .replace(/,\s*,/g, ",") // Fix double commas with space
      .replace(/([.!?])\s+(\w)/g, (_, punct, letter) => `${punct} ${letter.toUpperCase()}`) // Capitalize after sentence-ending punctuation
      .trim();

    // Capitalize first character
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Get after score
    const after = detectAI(cleaned);

    // Deduplicate pattern names
    const uniquePatterns = [...new Set(removedPatterns)];

    res.json({
      result: cleaned,
      aiScoreBefore: before.score,
      aiScoreAfter: after.score,
      patternsRemoved: uniquePatterns,
    });
  } catch (error) {
    next(error);
  }
});

// Profile endpoint (authenticated)
app.post("/v1/profile", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, name } = req.body;
    
    // Validate text
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
    }
    if (text.length < 100) {
      return res.status(400).json({ error: "Text must be at least 100 characters for voice profiling" });
    }
    if (text.length > 50000) {
      return res.status(413).json({ error: "Text exceeds maximum length of 50,000 characters" });
    }
    
    // Validate name
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'name' field" });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: "Name must be 100 characters or less" });
    }

    const profile = buildProfile(text, name);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Match endpoint (authenticated)
app.post("/v1/match", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, profile } = req.body;
    
    // Validate text
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
    }
    if (text.length < 50) {
      return res.status(400).json({ error: "Text must be at least 50 characters" });
    }
    if (text.length > 50000) {
      return res.status(413).json({ error: "Text exceeds maximum length of 50,000 characters" });
    }
    
    // Validate profile structure
    const validationError = validateProfile(profile);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Freeze profile to prevent prototype pollution
    const safeProfile = Object.freeze(JSON.parse(JSON.stringify(profile)));
    const result = matchVoice(text, safeProfile);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// OpenAPI spec endpoint (unauthenticated)
app.get("/openapi.json", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const openapiPath = path.join(__dirname, "../openapi.json");
    const openapi = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
    res.json(openapi);
  } catch (error) {
    next(error);
  }
});

// Privacy policy endpoint (unauthenticated)
app.get("/privacy-policy", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const privacyPath = path.join(__dirname, "../privacy-policy.md");
    const privacy = fs.readFileSync(privacyPath, "utf-8");
    res.type("text/markdown").send(privacy);
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Voicekeeper API server running on port ${PORT}`);
});
