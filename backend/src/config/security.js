const DEFAULT_FRONTEND_URL = "http://localhost:5173";
const DEFAULT_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

function isProduction() {
    return process.env.NODE_ENV === "production";
}

function parseBoolean(value, fallback) {
    if (value === undefined || value === "") {
        return fallback;
    }

    if (value === "true") return true;
    if (value === "false") return false;

    throw new Error("AUTH_COOKIE_SECURE must be either true or false.");
}

function getAllowedOrigins() {
    const configuredOrigins = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return configuredOrigins.map((origin) => {
        try {
            return new URL(origin).origin;
        } catch {
            throw new Error(`Invalid FRONTEND_URL origin: ${origin}`);
        }
    });
}

function getCookieMaxAge() {
    const configuredMaxAge = Number(
        process.env.AUTH_COOKIE_MAX_AGE_MS || DEFAULT_COOKIE_MAX_AGE_MS
    );

    if (!Number.isSafeInteger(configuredMaxAge) || configuredMaxAge <= 0) {
        throw new Error("AUTH_COOKIE_MAX_AGE_MS must be a positive integer.");
    }

    return configuredMaxAge;
}

function getAuthCookieOptions() {
    const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || "lax").toLowerCase();
    const secure = parseBoolean(process.env.AUTH_COOKIE_SECURE, isProduction());
    const path = process.env.AUTH_COOKIE_PATH || "/api";

    if (!["lax", "strict", "none"].includes(sameSite)) {
        throw new Error("AUTH_COOKIE_SAME_SITE must be lax, strict, or none.");
    }

    if (sameSite === "none" && !secure) {
        throw new Error("AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.");
    }

    const options = {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: getCookieMaxAge(),
        path,
    };

    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }

    return options;
}

function getAuthCookieClearOptions() {
    const { maxAge, ...clearOptions } = getAuthCookieOptions();
    return clearOptions;
}

function getOAuthStateCookieOptions() {
    const { secure, domain } = getAuthCookieOptions();
    const options = {
        httpOnly: true,
        secure,
        sameSite: "lax",
        maxAge: OAUTH_STATE_MAX_AGE_MS,
        path: "/api/auth/oauth",
    };

    if (domain) {
        options.domain = domain;
    }

    return options;
}

function getOAuthStateCookieClearOptions() {
    const { maxAge, ...clearOptions } = getOAuthStateCookieOptions();
    return clearOptions;
}

function getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "1d";
}

module.exports = {
    getAllowedOrigins,
    getAuthCookieOptions,
    getAuthCookieClearOptions,
    getOAuthStateCookieOptions,
    getOAuthStateCookieClearOptions,
    getJwtExpiresIn,
    isProduction,
};
