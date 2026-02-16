const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { AI_PATTERNS, CATEGORIES } = require("../dist/patterns/ai-patterns.js");

describe("AI patterns", () => {
  it("should export AI_PATTERNS array", () => {
    assert.ok(Array.isArray(AI_PATTERNS));
    assert.ok(AI_PATTERNS.length > 0);
  });

  it("should have valid pattern entries", () => {
    for (const entry of AI_PATTERNS) {
      assert.ok(entry.pattern instanceof RegExp, `Pattern should be RegExp: ${entry.label}`);
      assert.ok(typeof entry.label === "string");
      assert.ok(typeof entry.category === "string");
      assert.ok(["low", "medium", "high"].includes(entry.severity));
    }
  });

  it("should export CATEGORIES array", () => {
    assert.ok(Array.isArray(CATEGORIES));
    assert.ok(CATEGORIES.includes("hedging"));
    assert.ok(CATEGORIES.includes("transitions"));
    assert.ok(CATEGORIES.includes("fluff"));
    assert.ok(CATEGORIES.includes("politeness"));
    assert.ok(CATEGORIES.includes("qualifiers"));
    assert.ok(CATEGORIES.includes("structure"));
  });

  it("should have patterns for each category", () => {
    for (const cat of CATEGORIES) {
      const patterns = AI_PATTERNS.filter(p => p.category === cat);
      assert.ok(patterns.length > 0, `No patterns found for category: ${cat}`);
    }
  });

  it("should match known hedging pattern", () => {
    const hedging = AI_PATTERNS.find(p => p.category === "hedging");
    assert.ok(hedging);
    hedging.pattern.lastIndex = 0;
    assert.ok(hedging.pattern.test("It is important to note that this matters."));
  });

  it("should match known fluff pattern", () => {
    const fluff = AI_PATTERNS.find(p => p.label.includes("Delve"));
    assert.ok(fluff);
    fluff.pattern.lastIndex = 0;
    assert.ok(fluff.pattern.test("Let us delve into the topic."));
  });

  it("should match known politeness pattern", () => {
    const polite = AI_PATTERNS.find(p => p.label.includes("happy to"));
    assert.ok(polite);
    polite.pattern.lastIndex = 0;
    assert.ok(polite.pattern.test("I'd be happy to help you with that."));
  });
});
