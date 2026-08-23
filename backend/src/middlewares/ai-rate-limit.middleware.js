const { getAiUsageConfig } = require("../config/ai-usage");
const { createRateLimiter, getClientIp } = require("./rate-limit.middleware");

const config = getAiUsageConfig();

const interviewGenerationRateLimiter = createRateLimiter({
    windowMs: config.report.rateLimitWindowMs,
    max: config.report.rateLimitMax,
    keyPrefix: "interview-generation",
    message: "Too many interview reports generated. Please wait before trying again.",
});

const interviewGenerationIpRateLimiter = createRateLimiter({
    windowMs: config.report.rateLimitWindowMs,
    max: config.report.ipRateLimitMax,
    keyPrefix: "interview-generation-ip",
    keyGenerator: getClientIp,
    message: "Too many interview report requests from this network. Please wait before trying again.",
});

const resumePdfRateLimiter = createRateLimiter({
    windowMs: config.resumePdf.rateLimitWindowMs,
    max: config.resumePdf.rateLimitMax,
    keyPrefix: "resume-pdf",
    message: "Too many resume PDF requests. Please wait before trying again.",
});

const resumePdfIpRateLimiter = createRateLimiter({
    windowMs: config.resumePdf.rateLimitWindowMs,
    max: config.resumePdf.ipRateLimitMax,
    keyPrefix: "resume-pdf-ip",
    keyGenerator: getClientIp,
    message: "Too many resume PDF requests from this network. Please wait before trying again.",
});

module.exports = {
    interviewGenerationIpRateLimiter,
    interviewGenerationRateLimiter,
    resumePdfIpRateLimiter,
    resumePdfRateLimiter,
};
