import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const voicekeeper = require("../../dist/index.js");
const detectAI: (text: string) => {
  score: number;
  verdict: string;
  flags: Array<{ pattern: string; category: string; matches: string[]; severity: string }>;
  summary: string;
} = voicekeeper.detectAI;

const app = express();
const PORT = process.env.PORT || 8080;

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

// Health endpoint
app.get("/v1/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "0.1.0" });
});

// Detect AI endpoint
app.post("/v1/detect", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
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

// Proofread endpoint
app.post("/v1/proofread", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
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

// OpenAPI spec endpoint
app.get("/openapi.json", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const openapiPath = path.join(__dirname, "../openapi.json");
    const openapi = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
    res.json(openapi);
  } catch (error) {
    next(error);
  }
});

// Privacy policy endpoint
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
