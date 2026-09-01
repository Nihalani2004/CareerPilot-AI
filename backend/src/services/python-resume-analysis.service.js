const { z } = require("zod");
const { getResumeAnalysisConfig } = require("../config/resume-analysis");

const priority = z.enum(["critical", "high", "medium", "low"]);
const score = z.number().finite().min(0).max(100);
const pythonAnalysisSchema = z.object({
    engineVersion: z.string().min(1).max(30),
    text: z.string().max(50000),
    scores: z.object({
        parseability: score,
        layout: score,
        sections: score,
        evidence: score,
        skills: score,
        chronology: score,
        overall: score,
    }),
    skills: z.array(z.string().min(1).max(80)).max(80),
    sections: z.array(z.object({ key: z.string().min(1).max(50), label: z.string().min(1).max(120), present: z.boolean() })).min(4).max(8),
    findings: z.array(z.object({
        id: z.string().min(1).max(120),
        category: z.string().min(1).max(100),
        priority,
        title: z.string().min(1).max(160),
        detail: z.string().min(1).max(500),
        scoreImpact: z.number().finite().min(0).max(25),
        evidence: z.string().max(220).nullable(),
    })).max(12),
    document: z.object({
        pageCount: z.number().int().min(0).max(100),
        blockCount: z.number().int().min(0).max(10000),
        imageCount: z.number().int().min(0).max(1000),
        tableCount: z.number().int().min(0).max(1000),
        multiColumnPages: z.number().int().min(0).max(100),
        layoutWarnings: z.array(z.string().min(1).max(220)).max(4),
    }),
});

function unavailable(reason) {
    return { available: false, reason };
}

async function analyzeResumeWithPython({ buffer, fileName, mimeType }, { fetchImpl = globalThis.fetch, config = getResumeAnalysisConfig() } = {}) {
    if (!config.enabled) return unavailable("Python analysis is disabled.");
    if (typeof fetchImpl !== "function") return unavailable("The Node runtime does not provide fetch.");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
        const response = await fetchImpl(`${config.serviceUrl}/analyze`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                file_base64: buffer.toString("base64"),
                file_name: fileName,
                mime_type: mimeType,
            }),
        });
        if (!response.ok) return unavailable(`Python analysis service returned ${response.status}.`);
        const payload = pythonAnalysisSchema.safeParse(await response.json());
        if (!payload.success) return unavailable("Python analysis service returned an invalid response.");
        return { available: true, analysis: payload.data };
    } catch (error) {
        return unavailable(error?.name === "AbortError" ? "Python analysis timed out." : "Python analysis service is unavailable.");
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { analyzeResumeWithPython, pythonAnalysisSchema };
