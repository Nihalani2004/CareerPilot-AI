const test = require("node:test");
const assert = require("node:assert/strict");
const { buildLearningRoadmap, createRoadmapSourceHash } = require("../src/services/learning-roadmap.service");
const { calculateRoadmapReadiness } = require("../src/services/roadmap-readiness.service");
const { getYouTubeResourcesForTopic } = require("../src/services/learning-resource-catalog.service");

const report = {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    title: "MERN Developer",
    resume: "React and Node.js developer",
    selfDescription: "Built full-stack applications",
    jobDescription: "MERN developer with React, MongoDB, and system design experience.",
    skillGaps: [
        { skill: "MongoDB", severity: "high" },
        { skill: "System Design", severity: "medium" },
    ],
    preparationPlan: [{ day: 1, focus: "React performance", tasks: ["Review memoization"] }],
};

const settings = {
    durationWeeks: 2,
    hoursPerWeek: 6,
    intensity: "balanced",
    startDate: new Date("2026-08-31T00:00:00.000Z"),
    focusAreas: ["skill_gaps", "ats_evidence", "technical_interview"],
};

test("creates a stable, source-grounded learning roadmap", () => {
    const atsAnalysis = { requirements: [{ label: "Redis", status: "missing", importance: "high" }] };
    const first = buildLearningRoadmap({ report, atsAnalysis, settings });
    const second = buildLearningRoadmap({ report, atsAnalysis, settings });

    assert.equal(first.sourceHash, second.sourceHash);
    assert.ok(first.tasks.length >= 5);
    assert.ok(first.tasks.some((task) => task.sourceEvidence.skillGap === "MongoDB" && task.priority === "high"));
    assert.ok(first.tasks.some((task) => task.sourceEvidence.atsRequirement === "Redis"));
    assert.ok(first.tasks.every((task) => task.resources.length > 0));
    assert.ok(first.tasks.every((task) => task.resources.some((resource) => resource.provider.includes("YouTube"))));
    const mongodbTask = first.tasks.find((task) => task.sourceEvidence.skillGap === "MongoDB");
    assert.ok(mongodbTask.resources.some((resource) => resource.provider.includes("YouTube")));
    assert.ok(first.tasks.every((task) => task.scheduledDate instanceof Date));
    assert.equal(first.summary.taskCount, first.tasks.length);
});

test("changes the roadmap fingerprint when capacity settings change", () => {
    const first = createRoadmapSourceHash({ report, atsAnalysis: null, settings });
    const second = createRoadmapSourceHash({
        report,
        atsAnalysis: null,
        settings: { ...settings, hoursPerWeek: 10 },
    });

    assert.notEqual(first, second);
});

test("calculates readiness from weighted completion, priority coverage, and due work", () => {
    const now = new Date("2026-09-10T12:00:00.000Z");
    const readiness = calculateRoadmapReadiness([
        { priority: "high", status: "completed", scheduledDate: new Date("2026-09-01") },
        { priority: "medium", status: "todo", scheduledDate: new Date("2026-09-15") },
        { priority: "low", status: "completed", scheduledDate: new Date("2026-09-05") },
    ], now);

    assert.deepEqual(readiness, {
        score: 82,
        weightedCompletion: 67,
        highPriorityCompletion: 100,
        scheduleAdherence: 100,
        calculatedAt: now,
    });
});

test("ignores skipped tasks in readiness totals", () => {
    const readiness = calculateRoadmapReadiness([
        { priority: "high", status: "skipped", scheduledDate: new Date("2026-09-01") },
        { priority: "medium", status: "completed", scheduledDate: new Date("2026-09-01") },
    ], new Date("2026-09-10"));

    assert.equal(readiness.score, 100);
});

test("supplies a YouTube companion for both curated and fallback topics", () => {
    for (const topic of ["DSA", "Node.js", "Redis", "Interview practice"]) {
        const videos = getYouTubeResourcesForTopic(topic);
        assert.ok(videos.length > 0, `Expected a YouTube resource for ${topic}`);
        assert.ok(videos.every((resource) => resource.provider.includes("YouTube")));
    }
});
