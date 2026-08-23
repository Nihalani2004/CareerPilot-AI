const assert = require("node:assert/strict");
const test = require("node:test");

const interviewReportModel = require("../src/models/interviewReport.model");
const {
    createInterviewInputHash,
    getOrCreateInterviewReport,
} = require("../src/services/interview-cache.service");

function mockFindOne(result) {
    const originalFindOne = interviewReportModel.findOne;
    interviewReportModel.findOne = () => ({
        sort: async () => result,
    });

    return () => {
        interviewReportModel.findOne = originalFindOne;
    };
}

test("creates a stable hash for an identical interview submission", () => {
    const firstHash = createInterviewInputHash({
        resume: "  React developer  ",
        selfDescription: "  Built SaaS products ",
        jobDescription: " Node.js engineer ",
    });
    const secondHash = createInterviewInputHash({
        resume: "React developer",
        selfDescription: "Built SaaS products",
        jobDescription: "Node.js engineer",
    });

    assert.equal(firstHash, secondHash);
    assert.equal(firstHash.length, 64);
});

test("returns a persisted matching report without another AI generation", async () => {
    const cachedReport = { _id: "cached-report" };
    const restoreFindOne = mockFindOne(cachedReport);
    let generationCalls = 0;

    try {
        const result = await getOrCreateInterviewReport({
            userId: "cache-user",
            inputHash: "cached-input-hash",
            generateReport: async () => {
                generationCalls += 1;
                return { _id: "new-report" };
            },
        });

        assert.equal(result.reused, true);
        assert.equal(result.interviewReport, cachedReport);
        assert.equal(generationCalls, 0);
    } finally {
        restoreFindOne();
    }
});

test("reduces two identical in-flight submissions from two AI calls to one", async () => {
    const restoreFindOne = mockFindOne(null);
    let generationCalls = 0;
    let releaseGeneration;
    const generatedReport = { _id: "generated-report" };
    const generateReport = () => {
        generationCalls += 1;
        return new Promise((resolve) => {
            releaseGeneration = () => resolve(generatedReport);
        });
    };

    try {
        const first = getOrCreateInterviewReport({
            userId: "duplicate-user",
            inputHash: "duplicate-input-hash",
            generateReport,
        });
        const second = getOrCreateInterviewReport({
            userId: "duplicate-user",
            inputHash: "duplicate-input-hash",
            generateReport,
        });

        await new Promise((resolve) => setImmediate(resolve));
        releaseGeneration();
        const [firstResult, secondResult] = await Promise.all([first, second]);

        const baselineCalls = 2;
        const improvedCalls = generationCalls;
        const totalCallReductionPercent = ((baselineCalls - improvedCalls) / baselineCalls) * 100;

        assert.equal(firstResult.interviewReport, generatedReport);
        assert.equal(secondResult.interviewReport, generatedReport);
        assert.equal(improvedCalls, 1);
        assert.equal(totalCallReductionPercent, 50);
    } finally {
        restoreFindOne();
    }
});

test("adds indexes for report history and duplicate-input protection", () => {
    const indexes = interviewReportModel.schema.indexes();

    assert.ok(indexes.some(([fields]) => fields.user === 1 && fields.createdAt === -1));
    assert.ok(indexes.some(([fields, options]) => (
        fields.user === 1
        && fields.inputHash === 1
        && options.unique === true
    )));
});
