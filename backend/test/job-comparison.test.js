const test = require("node:test");
const assert = require("node:assert/strict");
const { createJobComparisonAnalysis, createSourceHash, hashJobDescription } = require("../src/services/job-comparison.service");

const descriptions = [
    { _id: "66f000000000000000000001", content: "Build React and Node.js applications. Use MongoDB, REST APIs, Git, testing, Docker and CI/CD." },
    { _id: "66f000000000000000000002", content: "Develop React services with Node.js, MongoDB and REST APIs. Improve performance, testing and deployment with Docker." },
    { _id: "66f000000000000000000003", content: "Maintain React web applications, APIs, Git workflows and Dockerized production deployments." },
];

test("compares repeated skills and high-demand tools across descriptions", () => {
    const analysis = createJobComparisonAnalysis({ targetRole: "Full Stack Developer", jobDescriptions: descriptions });
    const react = analysis.requirements.find((requirement) => requirement.key === "react");
    const docker = analysis.highDemandTools.find((requirement) => requirement.key === "docker");

    assert.equal(analysis.totalDescriptions, 3);
    assert.equal(react.frequency, 3);
    assert.equal(react.importance, "critical");
    assert.equal(docker.frequency, 3);
    assert.equal(analysis.readiness.hasProfile, false);
    assert.equal(analysis.readiness.score, 0);
});

test("calculates explainable readiness only from profile evidence", () => {
    const profile = { resume: "Built React and Node.js applications with MongoDB, REST APIs, Git and Docker.", selfDescription: "Improved testing and performance for production services." };
    const analysis = createJobComparisonAnalysis({ targetRole: "Full Stack Developer", jobDescriptions: descriptions, profile });
    const reactGap = analysis.gaps.find((gap) => gap.key === "react");

    assert.equal(analysis.readiness.hasProfile, true);
    assert.ok(analysis.readiness.score > 0);
    assert.equal(reactGap.status, "matched");
    assert.match(reactGap.evidence, /React/i);
});

test("normalizes content when hashing and produces different analysis sources for changed content", () => {
    assert.equal(hashJobDescription("  React   Node.js "), hashJobDescription("react node.js"));
    const first = createSourceHash({ targetRole: "Developer", jobDescriptions: descriptions, profile: null });
    const second = createSourceHash({ targetRole: "Developer", jobDescriptions: [{ ...descriptions[0], content: "Different requirement" }, ...descriptions.slice(1)], profile: null });
    assert.notEqual(first, second);
});
