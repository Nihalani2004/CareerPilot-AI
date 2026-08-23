const DEFAULTS = {
    reportRateLimitWindowMs: 15 * 60 * 1000,
    reportRateLimitMax: 3,
    reportIpRateLimitMax: 6,
    reportDailyLimit: 10,
    pdfRateLimitWindowMs: 15 * 60 * 1000,
    pdfRateLimitMax: 5,
    pdfIpRateLimitMax: 10,
    pdfDailyLimit: 10,
    maxResumeCharacters: 15000,
    maxJobDescriptionCharacters: 8000,
    maxSelfDescriptionCharacters: 4000,
    geminiMaxConcurrent: 2,
    geminiMaxQueued: 8,
    pdfMaxConcurrent: 1,
    pdfMaxQueued: 4,
    pdfTimeoutMs: 30000,
};

function getPositiveInteger(name, fallback) {
    const value = process.env[name];

    if (value === undefined || value === "") {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }

    return parsed;
}

function getAiUsageConfig() {
    return {
        report: {
            rateLimitWindowMs: getPositiveInteger("AI_REPORT_RATE_LIMIT_WINDOW_MS", DEFAULTS.reportRateLimitWindowMs),
            rateLimitMax: getPositiveInteger("AI_REPORT_RATE_LIMIT_MAX", DEFAULTS.reportRateLimitMax),
            ipRateLimitMax: getPositiveInteger("AI_REPORT_IP_RATE_LIMIT_MAX", DEFAULTS.reportIpRateLimitMax),
            dailyLimit: getPositiveInteger("AI_REPORT_DAILY_LIMIT", DEFAULTS.reportDailyLimit),
        },
        resumePdf: {
            rateLimitWindowMs: getPositiveInteger("AI_PDF_RATE_LIMIT_WINDOW_MS", DEFAULTS.pdfRateLimitWindowMs),
            rateLimitMax: getPositiveInteger("AI_PDF_RATE_LIMIT_MAX", DEFAULTS.pdfRateLimitMax),
            ipRateLimitMax: getPositiveInteger("AI_PDF_IP_RATE_LIMIT_MAX", DEFAULTS.pdfIpRateLimitMax),
            dailyLimit: getPositiveInteger("AI_PDF_DAILY_LIMIT", DEFAULTS.pdfDailyLimit),
        },
        input: {
            maxResumeCharacters: getPositiveInteger("AI_MAX_RESUME_CHARACTERS", DEFAULTS.maxResumeCharacters),
            maxJobDescriptionCharacters: getPositiveInteger("AI_MAX_JOB_DESCRIPTION_CHARACTERS", DEFAULTS.maxJobDescriptionCharacters),
            maxSelfDescriptionCharacters: getPositiveInteger("AI_MAX_SELF_DESCRIPTION_CHARACTERS", DEFAULTS.maxSelfDescriptionCharacters),
        },
        queue: {
            geminiMaxConcurrent: getPositiveInteger("GEMINI_MAX_CONCURRENT", DEFAULTS.geminiMaxConcurrent),
            geminiMaxQueued: getPositiveInteger("GEMINI_MAX_QUEUED", DEFAULTS.geminiMaxQueued),
            pdfMaxConcurrent: getPositiveInteger("PUPPETEER_MAX_CONCURRENT", DEFAULTS.pdfMaxConcurrent),
            pdfMaxQueued: getPositiveInteger("PUPPETEER_MAX_QUEUED", DEFAULTS.pdfMaxQueued),
            pdfTimeoutMs: getPositiveInteger("PUPPETEER_TIMEOUT_MS", DEFAULTS.pdfTimeoutMs),
        },
    };
}

module.exports = { getAiUsageConfig };
