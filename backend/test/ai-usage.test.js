const assert = require("node:assert/strict");
const test = require("node:test");

const { getAiUsageConfig } = require("../src/config/ai-usage");
const { createRateLimiter } = require("../src/middlewares/rate-limit.middleware");
const aiUsageModel = require("../src/models/aiUsage.model");
const { WorkQueue, ResourceBusyError } = require("../src/services/work-queue.service");

const ENV_KEYS = [
    "AI_REPORT_RATE_LIMIT_WINDOW_MS",
    "AI_REPORT_RATE_LIMIT_MAX",
    "AI_REPORT_IP_RATE_LIMIT_MAX",
    "AI_REPORT_DAILY_LIMIT",
    "AI_PDF_RATE_LIMIT_WINDOW_MS",
    "AI_PDF_RATE_LIMIT_MAX",
    "AI_PDF_IP_RATE_LIMIT_MAX",
    "AI_PDF_DAILY_LIMIT",
    "AI_MAX_RESUME_CHARACTERS",
    "AI_MAX_JOB_DESCRIPTION_CHARACTERS",
    "AI_MAX_SELF_DESCRIPTION_CHARACTERS",
    "GEMINI_MAX_CONCURRENT",
    "GEMINI_MAX_QUEUED",
    "PUPPETEER_MAX_CONCURRENT",
    "PUPPETEER_MAX_QUEUED",
    "PUPPETEER_TIMEOUT_MS",
];

function withEnv(values, callback) {
    const snapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    ENV_KEYS.forEach((key) => delete process.env[key]);
    Object.assign(process.env, values);

    try {
        return callback();
    } finally {
        ENV_KEYS.forEach((key) => {
            if (snapshot[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = snapshot[key];
            }
        });
    }
}

function createResponse() {
    return {
        headers: {},
        statusCode: null,
        payload: null,
        set(name, value) {
            this.headers[name] = value;
            return this;
        },
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

test("uses safe AI usage defaults and supports configuration", () => {
    withEnv({ AI_REPORT_DAILY_LIMIT: "7", PUPPETEER_TIMEOUT_MS: "45000" }, () => {
        const config = getAiUsageConfig();

        assert.equal(config.report.rateLimitMax, 3);
        assert.equal(config.report.ipRateLimitMax, 6);
        assert.equal(config.report.dailyLimit, 7);
        assert.equal(config.resumePdf.ipRateLimitMax, 10);
        assert.equal(config.resumePdf.dailyLimit, 10);
        assert.equal(config.queue.pdfTimeoutMs, 45000);
    });
});

test("rejects invalid AI usage configuration", () => {
    withEnv({ AI_REPORT_DAILY_LIMIT: "0" }, () => {
        assert.throws(() => getAiUsageConfig(), /AI_REPORT_DAILY_LIMIT must be a positive integer/);
    });
});

test("limits requests by authenticated user and returns retry information", () => {
    let now = 1000;
    const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        message: "Rate limit reached.",
        now: () => now,
    });
    const req = { user: { id: "user-1" } };
    const firstResponse = createResponse();
    let nextCalls = 0;

    limiter(req, firstResponse, () => {
        nextCalls += 1;
    });
    limiter(req, createResponse(), () => {
        nextCalls += 1;
    });

    const blockedResponse = createResponse();
    limiter(req, blockedResponse, () => {
        nextCalls += 1;
    });

    assert.equal(nextCalls, 1);
    assert.equal(blockedResponse.statusCode, 429);
    assert.equal(blockedResponse.payload.message, "Rate limit reached.");
    assert.equal(blockedResponse.headers["Retry-After"], "60");

    now += 60000;
    limiter(req, createResponse(), () => {
        nextCalls += 1;
    });
    assert.equal(nextCalls, 2);
});

test("bounds queued resource work instead of allowing unbounded Puppeteer jobs", async () => {
    const queue = new WorkQueue({ resourceName: "PDF generation service", maxConcurrent: 1, maxQueued: 1 });
    let releaseFirst;
    const first = queue.run(() => new Promise((resolve) => {
        releaseFirst = resolve;
    }));
    const second = queue.run(async () => "second");

    await assert.rejects(
        queue.run(async () => "third"),
        ResourceBusyError
    );

    releaseFirst("first");
    assert.equal(await first, "first");
    assert.equal(await second, "second");
});

test("persists per-user daily AI usage with automatic expiry", () => {
    const indexes = aiUsageModel.schema.indexes();

    assert.ok(indexes.some(([fields, options]) => (
        fields.user === 1
        && fields.action === 1
        && fields.periodStart === 1
        && options.unique === true
    )));
    assert.ok(indexes.some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
});
