const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildProfile, matchVoice } = require("../dist/index.js");

describe("matchVoice", () => {
  const referenceText = "I write in a distinctive way. Short punchy sentences. Lots of dashes — they break up the flow. Questions come naturally? Sure they do. Commas appear, often, in clusters. The rhythm matters. Each word earns its place. I write in a distinctive way. Short punchy sentences. The style stays consistent.";

  it("should return strong match when comparing text to its own profile", () => {
    const profile = buildProfile(referenceText, "author");
    const result = matchVoice(referenceText, profile);
    assert.equal(result.verdict, "strong_match");
    assert.ok(result.similarity >= 70);
  });

  it("should return lower similarity for very different writing styles", () => {
    const profile = buildProfile(referenceText, "author");
    const differentText = "The implementation of the aforementioned framework necessitates a comprehensive understanding of the underlying architectural paradigms. Furthermore, the utilization of distributed computing models presents significant challenges regarding scalability, fault tolerance, and consistency guarantees across heterogeneous environments.";
    const result = matchVoice(differentText, profile);
    assert.ok(result.similarity < 70);
  });

  it("should return deviations array", () => {
    const profile = buildProfile(referenceText, "author");
    const text = "This is completely different writing. Long academic sentences with many subordinate clauses that extend well beyond what most readers would consider comfortable, incorporating numerous prepositional phrases and technical terminology throughout.";
    const result = matchVoice(text, profile);
    assert.ok(Array.isArray(result.deviations));
  });

  it("should include valid severity in deviations", () => {
    const profile = buildProfile(referenceText, "author");
    const text = "A totally different style of writing here. Very formal. Extremely academic in nature. The prose tends toward verbosity with significant elaboration.";
    const result = matchVoice(text, profile);
    for (const dev of result.deviations) {
      assert.ok(["minor", "notable", "major"].includes(dev.severity));
      assert.ok(typeof dev.aspect === "string");
      assert.ok(typeof dev.expected === "string");
      assert.ok(typeof dev.actual === "string");
    }
  });

  it("should include a summary string", () => {
    const profile = buildProfile(referenceText, "author");
    const result = matchVoice("Some test text to analyze.", profile);
    assert.ok(typeof result.summary === "string");
    assert.ok(result.summary.length > 0);
  });

  it("should have similarity between 0 and 100", () => {
    const profile = buildProfile(referenceText, "author");
    const result = matchVoice("Random text for testing purposes here.", profile);
    assert.ok(result.similarity >= 0);
    assert.ok(result.similarity <= 100);
  });

  it("should return one of three verdicts", () => {
    const profile = buildProfile(referenceText, "author");
    const result = matchVoice("Some text.", profile);
    assert.ok(["strong_match", "partial_match", "no_match"].includes(result.verdict));
  });
});
