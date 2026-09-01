// Gemini 3.6 Flash is stable, supports structured output, and has an API free tier.
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

const RETIRED_GEMINI_MODELS = new Set([
    "gemini-2.5-pro",
    "models/gemini-2.5-pro",
]);

function getGeminiModel(value = process.env.GEMINI_MODEL) {
    const configuredModel = value?.trim();

    if (!configuredModel || RETIRED_GEMINI_MODELS.has(configuredModel)) {
        return DEFAULT_GEMINI_MODEL;
    }

    return configuredModel;
}

function isRetiredGeminiModel(value = process.env.GEMINI_MODEL) {
    return RETIRED_GEMINI_MODELS.has(value?.trim());
}

module.exports = {
    DEFAULT_GEMINI_MODEL,
    getGeminiModel,
    isRetiredGeminiModel,
};
