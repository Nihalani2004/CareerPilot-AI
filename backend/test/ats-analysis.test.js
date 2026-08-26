const assert = require("node:assert/strict");
const test = require("node:test");
const { buildAtsAnalysis, createAtsSourceHash } = require("../src/services/ats-analysis.service");

const report = {
    title: "MERN Stack Developer",
    resume: `
        PROFESSIONAL SUMMARY
        Full-stack developer building React and Node.js applications.
        TECHNICAL SKILLS
        JavaScript, React, Node.js, Express.js, MongoDB, REST APIs, JWT, Git
        PROJECTS
        Built CareerPilot AI with React, Express, MongoDB and JWT authentication.
        EDUCATION
        Bachelor of Technology in Computer Science.
    `,
    selfDescription: "Built secure REST APIs and responsive React interfaces.",
    jobDescription: "Required: React, Node.js, MongoDB, REST APIs, Docker and Redis. Preferred: AWS. Strong communication skills are required.",
    skillGaps: [
        { skill: "Docker", severity: "high" },
        { skill: "Redis", severity: "medium" },
    ],
    matchScore: 76,
};

test("creates a stable source hash for identical report inputs", () => {
    const first = createAtsSourceHash(report);
    const second = createAtsSourceHash({ ...report, resume: ` ${report.resume} ` });

    assert.equal(first, second);
    assert.equal(first.length, 64);
});

test("builds explainable requirements without claiming missing skills are present", () => {
    const analysis = buildAtsAnalysis(report);
    const react = analysis.requirements.find((requirement) => requirement.key === "react");
    const docker = analysis.requirements.find((requirement) => requirement.key === "docker");
    const redis = analysis.requirements.find((requirement) => requirement.key === "redis");

    assert.equal(react.status, "matched");
    assert.match(react.evidence, /react/i);
    assert.equal(docker.status, "missing");
    assert.equal(redis.status, "missing");
    assert.ok(analysis.suggestions.some((suggestion) => suggestion.id === "requirement-docker"));
    assert.ok(analysis.suggestions.every((suggestion) => suggestion.status === "open"));
});

test("returns bounded metrics, sections, and an audit checklist", () => {
    const analysis = buildAtsAnalysis(report);

    for (const metric of Object.values(analysis.metrics)) {
        if (metric !== null) {
            assert.ok(metric >= 0 && metric <= 100);
        }
    }

    assert.equal(analysis.sections.length, 6);
    assert.ok(analysis.auditChecklist.some((item) => item.key === "standard-headings"));
    assert.ok(analysis.keywordCoverage.length > 0);
});
