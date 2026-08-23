const assert = require("node:assert/strict");
const test = require("node:test");

const {
    getAllowedOrigins,
    getAuthCookieClearOptions,
    getAuthCookieOptions,
} = require("../src/config/security");
const { verifyTrustedOrigin } = require("../src/middlewares/csrf.middleware");
const tokenBlacklistModel = require("../src/models/blacklist.model");

const ENV_KEYS = [
    "NODE_ENV",
    "FRONTEND_URL",
    "AUTH_COOKIE_SECURE",
    "AUTH_COOKIE_SAME_SITE",
    "AUTH_COOKIE_MAX_AGE_MS",
    "AUTH_COOKIE_PATH",
    "AUTH_COOKIE_DOMAIN",
];

function withEnv(values, callback) {
    const snapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

    for (const key of ENV_KEYS) {
        delete process.env[key];
    }
    Object.assign(process.env, values);

    try {
        return callback();
    } finally {
        for (const key of ENV_KEYS) {
            if (snapshot[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = snapshot[key];
            }
        }
    }
}

function createResponse() {
    return {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        },
    };
}

test("uses safe local-development cookie defaults", () => {
    withEnv({ NODE_ENV: "development" }, () => {
        assert.deepEqual(getAuthCookieOptions(), {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 86400000,
            path: "/api",
        });
    });
});

test("uses HTTPS-only production cookie defaults and matching clear options", () => {
    withEnv({ NODE_ENV: "production" }, () => {
        assert.deepEqual(getAuthCookieOptions(), {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 86400000,
            path: "/api",
        });
        assert.deepEqual(getAuthCookieClearOptions(), {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/api",
        });
    });
});

test("rejects cross-site cookie configuration without HTTPS", () => {
    withEnv({ AUTH_COOKIE_SAME_SITE: "none", AUTH_COOKIE_SECURE: "false" }, () => {
        assert.throws(
            () => getAuthCookieOptions(),
            /AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true/
        );
    });
});

test("normalizes configured frontend origins", () => {
    withEnv({ FRONTEND_URL: "https://app.example.com/, https://admin.example.com" }, () => {
        assert.deepEqual(getAllowedOrigins(), [
            "https://app.example.com",
            "https://admin.example.com",
        ]);
    });
});

test("blocks unsafe requests from an untrusted browser origin in production", () => {
    withEnv({ NODE_ENV: "production", FRONTEND_URL: "https://app.example.com" }, () => {
        const req = { method: "POST", get: () => "https://attacker.example" };
        const res = createResponse();
        let nextCalled = false;

        verifyTrustedOrigin(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 403);
        assert.equal(res.payload.message, "Request origin is not allowed.");
    });
});

test("expires blacklisted tokens automatically after their JWT expiration", () => {
    const expiresAt = tokenBlacklistModel.schema.path("expiresAt");

    assert.equal(expiresAt.options.required[0], true);
    assert.equal(expiresAt.options.index.expires, 0);
});
