const { createRateLimiter } = require("./rate-limit.middleware");

const resumeAtsRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 12,
    keyPrefix: "resume-ats",
    message: "Too many resume ATS scans. Please wait before scanning another resume.",
});

module.exports = { resumeAtsRateLimiter };
