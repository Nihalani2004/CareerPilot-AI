const test = require("node:test");
const assert = require("node:assert/strict");
const { ANALYSIS_VERSION, buildResumeAtsAnalysis, createContentHash, mergePythonResumeAnalysis } = require("../src/services/resume-ats.service");

const strongResume = `
Mayank Nihalani
mayank@example.com | +91 9351119260 | linkedin.com/in/mayank | github.com/mayank

Professional Summary
Full Stack Developer with experience building scalable web applications.

Technical Skills
JavaScript, TypeScript, React, Node.js, Express, MongoDB, REST APIs, Docker, Git, AWS, Testing

Experience
Developed and optimized React and Node.js applications. Reduced API response time by 30% and supported 10,000 users.
Implemented automated testing and deployed services using Docker.

Projects
Built a career platform with MongoDB and REST APIs, improving report generation by 25%.

Education
Bachelor of Technology in Computer Science

Certifications
AWS Cloud Practitioner
`;

test("builds an explainable bounded ATS-readiness score for a structured resume", () => {
    const result = buildResumeAtsAnalysis(strongResume);
    assert.equal(ANALYSIS_VERSION, 4);
    assert.ok(result.overallScore >= 70 && result.overallScore <= 100);
    assert.equal(result.scores.length, 6);
    assert.equal(result.contacts.email, true);
    assert.equal(result.contacts.phone, true);
    assert.ok(result.skills.includes("React"));
    assert.ok(result.sections.find((section) => section.key === "education").present);
    assert.ok(result.recommendations.length >= 1 && result.recommendations.length <= 3);
    assert.ok(result.recommendations.every((recommendation) => recommendation.focus && recommendation.action));
    assert.match(result.disclaimer, /not a hiring prediction/i);
});

test("flags an unreadable or incomplete resume without creating an unbounded score", () => {
    const result = buildResumeAtsAnalysis("Resume");
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    assert.equal(result.parserHealth.wordCount, 1);
    assert.ok(result.findings.some((finding) => finding.id === "parser-text"));
    assert.ok(result.findings.some((finding) => finding.id === "contact-email"));
});

test("does not mistake section words in prose for ATS-readable headings", () => {
    const result = buildResumeAtsAnalysis("I built projects using React and listed skills such as JavaScript in my experience.");
    assert.equal(result.sections.find((section) => section.key === "skills").present, false);
    assert.equal(result.sections.find((section) => section.key === "experience").present, false);
});

test("creates stable binary content hashes for duplicate scan detection", () => {
    const first = createContentHash(Buffer.from("same resume bytes"));
    const second = createContentHash(Buffer.from("same resume bytes"));
    const different = createContentHash(Buffer.from("different resume bytes"));
    assert.equal(first, second);
    assert.notEqual(first, different);
});

test("merges validated Python document signals into an explainable hybrid result", () => {
    const base = buildResumeAtsAnalysis(strongResume);
    const merged = mergePythonResumeAnalysis(base, {
        engineVersion: "1.0.0",
        text: strongResume,
        scores: { parseability: 92, layout: 96, sections: 100, evidence: 90, skills: 96, chronology: 100, overall: 95 },
        skills: ["React", "Node.js", "Docker"],
        findings: [{ id: "python-layout-0", category: "Document layout", priority: "medium", title: "Simplify the document layout", detail: "Use a text-first layout.", scoreImpact: 5, evidence: "Potential table detected" }],
        sections: [],
        document: { pageCount: 1, blockCount: 18, imageCount: 0, tableCount: 0, multiColumnPages: 0, layoutWarnings: [] },
    });

    assert.equal(merged.analysisMeta.mode, "python-enhanced");
    assert.equal(merged.analysisMeta.engineVersion, "1.0.0");
    assert.ok(merged.overallScore >= base.overallScore);
    assert.ok(merged.findings.some((finding) => finding.id === "python-layout-0"));
    assert.equal(merged.scores.length, 6);
});

test("keeps deterministic analysis available when Python enrichment is unavailable", () => {
    const base = buildResumeAtsAnalysis(strongResume);
    const fallback = mergePythonResumeAnalysis(base, null);
    assert.equal(fallback.analysisMeta.mode, "deterministic-fallback");
    assert.equal(fallback.overallScore, base.overallScore);
});
