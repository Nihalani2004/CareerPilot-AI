function getRequestIdentity(req) {
    return String(req.user?.id || req.user?._id || req.ip || "anonymous");
}

function getClientIp(req) {
    return String(req.ip || req.socket?.remoteAddress || "unknown");
}

function createRateLimiter({ windowMs, max, message, keyPrefix = "", keyGenerator = getRequestIdentity, now = () => Date.now() }) {
    const buckets = new Map();

    return (req, res, next) => {
        const timestamp = now();
        const key = `${keyPrefix}:${keyGenerator(req)}`;
        const existing = buckets.get(key);
        const bucket = !existing || existing.resetAt <= timestamp
            ? { count: 0, resetAt: timestamp + windowMs }
            : existing;

        if (bucket.count >= max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1000));
            res.set("Retry-After", String(retryAfterSeconds));
            return res.status(429).json({
                message,
                retryAfterSeconds,
            });
        }

        bucket.count += 1;
        buckets.set(key, bucket);

        if (buckets.size > 10000) {
            for (const [bucketKey, value] of buckets) {
                if (value.resetAt <= timestamp) {
                    buckets.delete(bucketKey);
                }
            }
        }

        return next();
    };
}

module.exports = { createRateLimiter, getClientIp, getRequestIdentity };
