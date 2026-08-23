const { getAllowedOrigins, isProduction } = require("../config/security");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function verifyTrustedOrigin(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const origin = req.get("origin");

    // Browser requests include Origin. Keeping origin-less requests available in
    // local development preserves CLI testing, while production fails closed.
    if (!origin) {
        if (isProduction()) {
            return res.status(403).json({ message: "Origin header is required." });
        }
        return next();
    }

    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ message: "Request origin is not allowed." });
    }

    return next();
}

module.exports = { verifyTrustedOrigin };
