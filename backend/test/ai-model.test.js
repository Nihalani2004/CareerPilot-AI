const assert = require("node:assert/strict");
const test = require("node:test");

const {
    DEFAULT_GEMINI_MODEL,
    getGeminiModel,
    isRetiredGeminiModel,
} = require("../src/config/ai-model");

test("uses Gemini 3.6 Flash by default", () => {
    assert.equal(DEFAULT_GEMINI_MODEL, "gemini-3.6-flash");
    assert.equal(getGeminiModel(), "gemini-3.6-flash");
});

test("upgrades the retired Gemini 2.5 Pro configuration", () => {
    assert.equal(getGeminiModel("gemini-2.5-pro"), "gemini-3.6-flash");
    assert.equal(getGeminiModel("models/gemini-2.5-pro"), "gemini-3.6-flash");
    assert.equal(isRetiredGeminiModel("gemini-2.5-pro"), true);
});

test("keeps an explicitly configured supported model", () => {
    assert.equal(getGeminiModel("gemini-3.1-pro-preview"), "gemini-3.1-pro-preview");
    assert.equal(isRetiredGeminiModel("gemini-3.1-pro-preview"), false);
});
