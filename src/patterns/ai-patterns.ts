export interface PatternEntry {
  pattern: RegExp;
  label: string;
  category: string;
  severity: "low" | "medium" | "high";
}

// Hedging phrases — AI models over-qualify everything
const hedging: PatternEntry[] = [
  { pattern: /\bit(?:'s| is) (?:important|worth|crucial) to (?:note|mention|remember|consider)\b/gi, label: "Hedging qualifier", category: "hedging", severity: "high" },
  { pattern: /\bit(?:'s| is) worth (?:noting|mentioning|pointing out)\b/gi, label: "Worth noting hedge", category: "hedging", severity: "high" },
  { pattern: /\bit should be (?:noted|mentioned|emphasized)\b/gi, label: "Should be noted", category: "hedging", severity: "high" },
  { pattern: /\bwhile (?:there are|this|it) (?:may|might|can|could) (?:seem|appear|be)\b/gi, label: "While-hedge opener", category: "hedging", severity: "medium" },
  { pattern: /\bthat (?:being )?said\b/gi, label: "That said pivot", category: "hedging", severity: "low" },
  { pattern: /\bhaving said that\b/gi, label: "Having said that", category: "hedging", severity: "low" },
  { pattern: /\bon the other hand\b/gi, label: "On the other hand", category: "hedging", severity: "low" },
  { pattern: /\bit(?:'s| is) (?:also )?(?:important|essential|crucial|vital|key) to (?:understand|recognize|acknowledge)\b/gi, label: "Important to understand", category: "hedging", severity: "high" },
];

// Formulaic transitions — AI loves mechanical connectors
const transitions: PatternEntry[] = [
  { pattern: /\bfurthermore\b/gi, label: "Furthermore", category: "transitions", severity: "medium" },
  { pattern: /\bmoreover\b/gi, label: "Moreover", category: "transitions", severity: "medium" },
  { pattern: /\badditionally\b/gi, label: "Additionally", category: "transitions", severity: "medium" },
  { pattern: /\bin conclusion\b/gi, label: "In conclusion", category: "transitions", severity: "medium" },
  { pattern: /\bto summarize\b/gi, label: "To summarize", category: "transitions", severity: "medium" },
  { pattern: /\bin summary\b/gi, label: "In summary", category: "transitions", severity: "low" },
  { pattern: /\bthat said\b/gi, label: "That said", category: "transitions", severity: "low" },
  { pattern: /\bnevertheless\b/gi, label: "Nevertheless", category: "transitions", severity: "medium" },
  { pattern: /\bnonetheless\b/gi, label: "Nonetheless", category: "transitions", severity: "medium" },
  { pattern: /\bconversely\b/gi, label: "Conversely", category: "transitions", severity: "medium" },
];

// Corporate/academic fluff — AI defaults to formal register
const fluff: PatternEntry[] = [
  { pattern: /\bleverage\b/gi, label: "Leverage (verb)", category: "fluff", severity: "medium" },
  { pattern: /\butilize\b/gi, label: "Utilize instead of use", category: "fluff", severity: "medium" },
  { pattern: /\bfacilitate\b/gi, label: "Facilitate", category: "fluff", severity: "medium" },
  { pattern: /\bstreamline\b/gi, label: "Streamline", category: "fluff", severity: "low" },
  { pattern: /\boptimize\b/gi, label: "Optimize", category: "fluff", severity: "low" },
  { pattern: /\bimplement\b/gi, label: "Implement", category: "fluff", severity: "low" },
  { pattern: /\bensure\b/gi, label: "Ensure", category: "fluff", severity: "low" },
  { pattern: /\brobust\b/gi, label: "Robust", category: "fluff", severity: "medium" },
  { pattern: /\bseamless(?:ly)?\b/gi, label: "Seamless(ly)", category: "fluff", severity: "high" },
  { pattern: /\bdelve\b/gi, label: "Delve", category: "fluff", severity: "high" },
  { pattern: /\btapestry\b/gi, label: "Tapestry", category: "fluff", severity: "high" },
  { pattern: /\blandscape\b/gi, label: "Landscape (figurative)", category: "fluff", severity: "medium" },
  { pattern: /\bholistic\b/gi, label: "Holistic", category: "fluff", severity: "medium" },
  { pattern: /\boverall\b/gi, label: "Overall", category: "fluff", severity: "low" },
  { pattern: /\bin today(?:'s| s) (?:world|age|landscape|digital|fast-paced)\b/gi, label: "In today's world", category: "fluff", severity: "high" },
];

// Excessive politeness — AI assistant patterns leaking into text
const politeness: PatternEntry[] = [
  { pattern: /\bI(?:'d| would) be happy to\b/gi, label: "I'd be happy to", category: "politeness", severity: "high" },
  { pattern: /\bcertainly!\b/gi, label: "Certainly!", category: "politeness", severity: "high" },
  { pattern: /\babsolutely!\b/gi, label: "Absolutely!", category: "politeness", severity: "medium" },
  { pattern: /\bgreat question\b/gi, label: "Great question", category: "politeness", severity: "high" },
  { pattern: /\bthat(?:'s| is) a (?:great|excellent|good|fantastic|wonderful) (?:question|point|observation)\b/gi, label: "That's a great question", category: "politeness", severity: "high" },
  { pattern: /\bI hope (?:this|that) helps\b/gi, label: "I hope this helps", category: "politeness", severity: "high" },
  { pattern: /\blet me know if you (?:have|need)\b/gi, label: "Let me know if you need", category: "politeness", severity: "medium" },
  { pattern: /\bfeel free to\b/gi, label: "Feel free to", category: "politeness", severity: "medium" },
];

// Vague qualifiers — AI hedges with imprecise language
const qualifiers: PatternEntry[] = [
  { pattern: /\bvarious (?:factors|reasons|aspects|elements|considerations)\b/gi, label: "Various factors", category: "qualifiers", severity: "medium" },
  { pattern: /\ba (?:number|variety|range|multitude) of\b/gi, label: "A number of", category: "qualifiers", severity: "medium" },
  { pattern: /\bdepending on (?:various|the|your|specific)\b/gi, label: "Depending on various", category: "qualifiers", severity: "medium" },
  { pattern: /\bin (?:many|some|various|certain) (?:cases|situations|contexts|scenarios)\b/gi, label: "In many cases", category: "qualifiers", severity: "medium" },
  { pattern: /\bcan be (?:quite|very|rather|somewhat|incredibly)\b/gi, label: "Can be quite", category: "qualifiers", severity: "low" },
  { pattern: /\bplay(?:s)? a (?:crucial|key|vital|important|significant|pivotal) role\b/gi, label: "Plays a crucial role", category: "qualifiers", severity: "high" },
];

// Structure patterns — AI loves enumeration
const structure: PatternEntry[] = [
  { pattern: /(?:^|\n)\s*(?:first(?:ly)?|second(?:ly)?|third(?:ly)?|finally),?\s/gim, label: "Enumerated list", category: "structure", severity: "low" },
  { pattern: /\b(?:here are|here's|let's look at|let's explore|let's examine)\b/gi, label: "Here are / Let's", category: "structure", severity: "medium" },
  { pattern: /\b(?:key (?:takeaways?|points?|considerations?|benefits?|advantages?|features?))\b/gi, label: "Key takeaways", category: "structure", severity: "medium" },
  { pattern: /\bpros and cons\b/gi, label: "Pros and cons", category: "structure", severity: "low" },
];

export const AI_PATTERNS: PatternEntry[] = [
  ...hedging,
  ...transitions,
  ...fluff,
  ...politeness,
  ...qualifiers,
  ...structure,
];

export const CATEGORIES = ["hedging", "transitions", "fluff", "politeness", "qualifiers", "structure"] as const;
export type PatternCategory = typeof CATEGORIES[number];
