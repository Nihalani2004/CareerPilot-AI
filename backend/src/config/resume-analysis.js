const DEFAULTS = {
    enabled: true,
    serviceUrl: "http://127.0.0.1:8001",
    timeoutMs: 4500,
};

function getBoolean(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value === "") return fallback;
    return value.trim().toLowerCase() !== "false";
}

function getPositiveInteger(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer.`);
    return parsed;
}

function getResumeAnalysisConfig() {
    const serviceUrl = (process.env.RESUME_ANALYSIS_SERVICE_URL || DEFAULTS.serviceUrl).trim().replace(/\/$/, "");
    try {
        const parsedUrl = new URL(serviceUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Unsupported protocol");
    } catch {
        throw new Error("RESUME_ANALYSIS_SERVICE_URL must be a valid HTTP(S) URL.");
    }

    return {
        enabled: getBoolean("RESUME_ANALYSIS_ENABLED", DEFAULTS.enabled),
        serviceUrl,
        timeoutMs: getPositiveInteger("RESUME_ANALYSIS_TIMEOUT_MS", DEFAULTS.timeoutMs),
    };
}

module.exports = { getResumeAnalysisConfig };
