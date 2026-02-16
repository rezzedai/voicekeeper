const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildProfile } = require("../dist/index.js");

describe("buildProfile", () => {
  const sampleText = "I write short sentences. Sometimes longer ones that meander a bit through the topic at hand. Questions are rare? But they happen. I like dashes — they add rhythm. And commas, yes, lots of commas. The style is conversational, direct, punchy. I write short sentences.";

  it("should return a VoiceProfile object with correct name", () => {
    const profile = buildProfile(sampleText, "test-author");
    assert.equal(profile.name, "test-author");
  });

  it("should track source length", () => {
    const profile = buildProfile(sampleText, "test");
    assert.equal(profile.sourceLength, sampleText.length);
  });

  it("should compute vocabulary stats", () => {
    const profile = buildProfile(sampleText, "test");
    assert.ok(profile.vocabulary.uniqueWords > 0);
    assert.ok(profile.vocabulary.totalWords > 0);
    assert.ok(profile.vocabulary.avgWordLength > 0);
    assert.ok(Array.isArray(profile.vocabulary.topWords));
    assert.ok(typeof profile.vocabulary.rarityScore === "number");
  });

  it("should compute sentence stats", () => {
    const profile = buildProfile(sampleText, "test");
    assert.ok(profile.sentences.count > 0);
    assert.ok(profile.sentences.avgLength > 0);
    assert.ok(profile.sentences.minLength > 0);
    assert.ok(profile.sentences.maxLength >= profile.sentences.minLength);
    assert.ok(typeof profile.sentences.stdDevLength === "number");
    assert.ok(typeof profile.sentences.questionRatio === "number");
    assert.ok(typeof profile.sentences.exclamationRatio === "number");
  });

  it("should compute punctuation stats", () => {
    const profile = buildProfile(sampleText, "test");
    assert.ok(typeof profile.punctuation.commasPerSentence === "number");
    assert.ok(typeof profile.punctuation.semicolonsPerSentence === "number");
    assert.ok(typeof profile.punctuation.dashesPerSentence === "number");
    assert.ok(typeof profile.punctuation.ellipsesCount === "number");
    assert.ok(typeof profile.punctuation.parenthesesCount === "number");
  });

  it("should extract distinctive phrases", () => {
    const profile = buildProfile(sampleText, "test");
    assert.ok(Array.isArray(profile.phrases));
  });

  it("should include createdAt timestamp", () => {
    const profile = buildProfile(sampleText, "test");
    assert.ok(typeof profile.createdAt === "string");
    // Should be a valid date string
    const date = new Date(profile.createdAt);
    assert.ok(!isNaN(date.getTime()));
  });

  it("should handle minimal text", () => {
    const profile = buildProfile("Hello world.", "minimal");
    assert.equal(profile.name, "minimal");
    assert.ok(profile.sentences.count >= 1);
  });

  it("should detect question ratio", () => {
    const text = "Is this a question? Yes it is. Another question? Indeed. How about this one? Sure thing.";
    const profile = buildProfile(text, "questions");
    assert.ok(profile.sentences.questionRatio > 0);
  });

  it("should detect exclamation ratio", () => {
    const text = "Wow! That is amazing! So cool. Incredible! Just normal.";
    const profile = buildProfile(text, "exclamations");
    assert.ok(profile.sentences.exclamationRatio > 0);
  });
});
