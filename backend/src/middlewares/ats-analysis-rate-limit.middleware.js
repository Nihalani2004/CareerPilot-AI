const { createRateLimiter } = require("./rate-limit.middleware");

// ATS analysis is deterministic and does not invoke Gemini, but a modest limit
// prevents repeated expensive document parsing and database writes.
const atsAnalysisRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: "ats-analysis",
    message: "Too many ATS analysis requests. Please wait before trying again.",
});

module.exports = { atsAnalysisRateLimiter };
