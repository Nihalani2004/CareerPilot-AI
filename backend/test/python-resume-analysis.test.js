const assert = require("node:assert/strict");
const test = require("node:test");
const { analyzeResumeWithPython } = require("../src/services/python-resume-analysis.service");

const sampleAnalysis = {
    engineVersion: "1.0.0",
    text: "Professional Summary\nTechnical Skills\nExperience\nEducation",
    scores: { parseability: 91, layout: 100, sections: 80, evidence: 70, skills: 75, chronology: 80, overall: 82 },
    skills: ["React", "Node.js"],
    sections: [
        { key: "summary", label: "Professional summary", present: true },
        { key: "skills", label: "Technical skills", present: true },
        { key: "experience", label: "Experience", present: true },
        { key: "education", label: "Education", present: true },
    ],
    findings: [],
    document: { pageCount: 1, blockCount: 8, imageCount: 0, tableCount: 0, multiColumnPages: 0, layoutWarnings: [] },
};

test("accepts a validated Python analysis response", async () => {
    const response = await analyzeResumeWithPython(
        { buffer: Buffer.from("resume"), fileName: "resume.pdf", mimeType: "application/pdf" },
        { config: { enabled: true, serviceUrl: "http://analysis.internal", timeoutMs: 100 }, fetchImpl: async () => ({ ok: true, json: async () => sampleAnalysis }) },
    );
    assert.equal(response.available, true);
    assert.equal(response.analysis.scores.overall, 82);
});

test("falls back safely when the Python service is unavailable or invalid", async () => {
    const response = await analyzeResumeWithPython(
        { buffer: Buffer.from("resume"), fileName: "resume.pdf", mimeType: "application/pdf" },
        { config: { enabled: true, serviceUrl: "http://analysis.internal", timeoutMs: 100 }, fetchImpl: async () => ({ ok: false, status: 503 }) },
    );
    assert.equal(response.available, false);
    assert.match(response.reason, /503/);
});
