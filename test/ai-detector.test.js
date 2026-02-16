const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { detectAI } = require("../dist/index.js");

describe("detectAI", () => {
  it("should return human verdict for very short text", () => {
    const result = detectAI("Hello world");
    assert.equal(result.verdict, "human");
    assert.equal(result.score, 0);
    assert.equal(result.flags.length, 0);
  });

  it("should return human verdict for natural human writing", () => {
    const text = "I went to the store yesterday. Picked up some bread and milk. The weather was nice so I walked. Got home around five. Made dinner, watched a show, went to bed early.";
    const result = detectAI(text);
    assert.equal(result.verdict, "human");
    assert.ok(result.score < 30);
  });

  it("should detect AI patterns in heavily AI-generated text", () => {
    const text = "It is important to note that leveraging robust frameworks can seamlessly facilitate the implementation of holistic solutions. Furthermore, it is worth mentioning that utilizing streamlined approaches plays a crucial role in optimizing various aspects of the development landscape. Additionally, in today's fast-paced world, ensuring that key considerations are addressed is vital. I'd be happy to help you explore these key takeaways. Great question! Let me know if you need further assistance.";
    const result = detectAI(text);
    assert.equal(result.verdict, "ai");
    assert.ok(result.score >= 60);
    assert.ok(result.flags.length > 0);
  });

  it("should identify specific pattern categories", () => {
    const text = "It is important to note that this is crucial. Furthermore, leveraging robust solutions can seamlessly optimize the holistic landscape. I'd be happy to help with that great question. Various factors play a crucial role in many cases.";
    const result = detectAI(text);
    const categories = result.flags.map(f => f.category);
    assert.ok(categories.includes("hedging") || categories.includes("fluff") || categories.includes("transitions"));
  });

  it("should return flags with correct structure", () => {
    const text = "It is important to note that furthermore this is a robust seamless solution. I'd be happy to help.";
    const result = detectAI(text);
    for (const flag of result.flags) {
      assert.ok(typeof flag.pattern === "string");
      assert.ok(typeof flag.category === "string");
      assert.ok(Array.isArray(flag.matches));
      assert.ok(["low", "medium", "high"].includes(flag.severity));
    }
  });

  it("should include summary in result", () => {
    const text = "This is a normal piece of text that should not trigger too many patterns. Just regular writing about nothing in particular.";
    const result = detectAI(text);
    assert.ok(typeof result.summary === "string");
    assert.ok(result.summary.length > 0);
  });

  it("should handle empty string", () => {
    const result = detectAI("");
    assert.equal(result.verdict, "human");
    assert.equal(result.score, 0);
  });

  it("should return mixed verdict for moderate AI signal", () => {
    const text = "The new framework leverages robust patterns to ensure seamless integration. However, there are various factors to consider. It's worth noting that implementation certainty plays a crucial role. The team should optimize their approach while considering key takeaways from previous projects.";
    const result = detectAI(text);
    // Score should be moderate
    assert.ok(result.score >= 20);
    assert.ok(["mixed", "ai"].includes(result.verdict));
  });
});
