const crypto = require("crypto");

const SKILL_CATALOG = [
    { key: "react", label: "React.js", category: "frontend", patterns: ["react", "react.js"] },
    { key: "javascript", label: "JavaScript", category: "language", patterns: ["javascript", "ecmascript"] },
    { key: "typescript", label: "TypeScript", category: "language", patterns: ["typescript"] },
    { key: "html-css", label: "HTML/CSS", category: "frontend", patterns: ["html", "css", "tailwind"] },
    { key: "node", label: "Node.js", category: "backend", patterns: ["node.js", "nodejs", "node js"] },
    { key: "express", label: "Express.js", category: "backend", patterns: ["express.js", "express js", "express"] },
    { key: "rest-apis", label: "REST APIs", category: "backend", patterns: ["rest api", "restful", "api development", "apis"] },
    { key: "mongodb", label: "MongoDB", category: "database", patterns: ["mongodb", "mongo db"] },
    { key: "sql", label: "SQL", category: "database", patterns: ["sql", "mysql", "postgresql", "postgres"] },
    { key: "redis", label: "Redis", category: "database", patterns: ["redis", "caching"] },
    { key: "git", label: "Git", category: "tooling", patterns: ["git", "github", "gitlab"] },
    { key: "docker", label: "Docker", category: "cloud_devops", patterns: ["docker", "containerization", "containers"] },
    { key: "aws", label: "AWS", category: "cloud_devops", patterns: ["aws", "amazon web services"] },
    { key: "cicd", label: "CI/CD", category: "cloud_devops", patterns: ["ci/cd", "continuous integration", "continuous deployment", "pipeline"] },
    { key: "testing", label: "Testing", category: "quality", patterns: ["jest", "unit test", "testing", "integration test"] },
    { key: "system-design", label: "System Design", category: "architecture", patterns: ["system design", "scalability", "distributed systems"] },
    { key: "data-structures", label: "Data Structures & Algorithms", category: "architecture", patterns: ["data structures", "algorithms", "dsa", "problem solving"] },
    { key: "oop", label: "OOP", category: "architecture", patterns: ["object oriented", "oops", "oop"] },
    { key: "graphql", label: "GraphQL", category: "backend", patterns: ["graphql"] },
    { key: "nextjs", label: "Next.js", category: "frontend", patterns: ["next.js", "nextjs", "next js"] },
];

const RESPONSIBILITY_CATALOG = [
    { key: "build-applications", label: "Build and maintain production applications", patterns: ["build", "develop", "maintain", "implement"] },
    { key: "api-design", label: "Design and integrate APIs", patterns: ["api", "rest", "backend service"] },
    { key: "collaboration", label: "Collaborate with cross-functional teams", patterns: ["collaborate", "cross-functional", "stakeholder", "product team", "design team"] },
    { key: "performance", label: "Improve performance and reliability", patterns: ["performance", "optimize", "reliability", "latency"] },
    { key: "testing-quality", label: "Maintain testing and code quality", patterns: ["test", "quality", "code review"] },
    { key: "deployment", label: "Deploy and operate services", patterns: ["deploy", "deployment", "production", "devops"] },
    { key: "database-design", label: "Design and manage data models", patterns: ["database", "schema", "data model"] },
];

const TOOL_CATEGORIES = new Set(["frontend", "backend", "database", "cloud_devops", "quality", "tooling"]);

function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasPattern(text, patterns) {
    return patterns.some((pattern) => text.includes(pattern));
}

function importanceFor(percentage) {
    if (percentage >= 80) return "critical";
    if (percentage >= 50) return "high";
    if (percentage >= 25) return "emerging";
    return "optional";
}

function profileEvidence(profile, requirement) {
    if (!profile) return null;
    const profileText = normalize(`${profile.resume || ""} ${profile.selfDescription || ""}`);
    const matchedPattern = requirement.patterns.find((pattern) => profileText.includes(pattern));
    return matchedPattern ? `Found “${matchedPattern}” in your saved profile.` : null;
}

function createSourceHash({ targetRole, jobDescriptions, profile }) {
    const value = {
        version: 1,
        targetRole: normalize(targetRole),
        profile: profile ? normalize(`${profile.resume || ""} ${profile.selfDescription || ""}`) : "",
        jobDescriptions: jobDescriptions.map((item) => ({ id: item._id?.toString(), content: normalize(item.content) })),
    };
    return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function createJobComparisonAnalysis({ targetRole, jobDescriptions, profile = null }) {
    const texts = jobDescriptions.map((item) => ({ id: item._id?.toString(), text: normalize(item.content) }));
    const count = texts.length;
    const requirements = SKILL_CATALOG.map((skill) => {
        const descriptionIds = texts.filter((item) => hasPattern(item.text, skill.patterns)).map((item) => item.id);
        if (!descriptionIds.length) return null;
        const percentage = Math.round((descriptionIds.length / count) * 100);
        return { key: skill.key, label: skill.label, category: skill.category, frequency: descriptionIds.length, percentage, importance: importanceFor(percentage), descriptionIds };
    }).filter(Boolean).sort((left, right) => right.frequency - left.frequency || left.label.localeCompare(right.label));

    const repeatedResponsibilities = RESPONSIBILITY_CATALOG.map((item) => {
        const descriptionIds = texts.filter((description) => hasPattern(description.text, item.patterns)).map((description) => description.id);
        if (!descriptionIds.length) return null;
        return { key: item.key, label: item.label, frequency: descriptionIds.length, percentage: Math.round((descriptionIds.length / count) * 100), descriptionIds };
    }).filter(Boolean).sort((left, right) => right.frequency - left.frequency || left.label.localeCompare(right.label));

    const repeatedSkills = requirements.filter((item) => item.frequency >= 2);
    const highDemandTools = requirements.filter((item) => TOOL_CATEGORIES.has(item.category) && item.frequency >= 2);
    const matchedRequirements = requirements.filter((requirement) => profileEvidence(profile, SKILL_CATALOG.find((skill) => skill.key === requirement.key)));
    const criticalRequirements = requirements.filter((item) => item.importance === "critical" || item.importance === "high");
    const coreRequirements = requirements.filter((item) => ["language", "architecture"].includes(item.category));
    const toolRequirements = requirements.filter((item) => TOOL_CATEGORIES.has(item.category));
    const matchedCore = coreRequirements.filter((requirement) => matchedRequirements.some((item) => item.key === requirement.key));
    const matchedTools = toolRequirements.filter((requirement) => matchedRequirements.some((item) => item.key === requirement.key));
    const coreSkillCoverage = coreRequirements.length ? Math.round((matchedCore.length / coreRequirements.length) * 100) : 0;
    const toolCoverage = toolRequirements.length ? Math.round((matchedTools.length / toolRequirements.length) * 100) : 0;
    const responsibilityAlignment = profile ? Math.round((repeatedResponsibilities.filter((item) => profileEvidence(profile, { patterns: RESPONSIBILITY_CATALOG.find((rule) => rule.key === item.key).patterns })).length / Math.max(repeatedResponsibilities.length, 1)) * 100) : 0;
    const evidenceQuality = profile ? Math.round((matchedRequirements.length / Math.max(criticalRequirements.length, 1)) * 100) : 0;
    const readinessScore = profile ? Math.round((coreSkillCoverage * 0.45) + (toolCoverage * 0.25) + (responsibilityAlignment * 0.20) + (evidenceQuality * 0.10)) : 0;

    const gaps = requirements.map((requirement) => {
        const catalogItem = SKILL_CATALOG.find((item) => item.key === requirement.key);
        const evidence = profileEvidence(profile, catalogItem);
        return { key: requirement.key, label: requirement.label, category: requirement.category, demandLevel: requirement.importance, status: evidence ? "matched" : "missing", evidence };
    }).filter((item) => item.demandLevel !== "optional");

    return {
        sourceHash: createSourceHash({ targetRole, jobDescriptions, profile }),
        totalDescriptions: count,
        requirements,
        repeatedSkills,
        highDemandTools,
        repeatedResponsibilities,
        readiness: { score: readinessScore, coreSkillCoverage, toolCoverage, responsibilityAlignment, evidenceQuality, hasProfile: Boolean(profile) },
        gaps,
        generatedAt: new Date(),
    };
}

function hashJobDescription(content) {
    return crypto.createHash("sha256").update(normalize(content)).digest("hex");
}

module.exports = { createJobComparisonAnalysis, createSourceHash, hashJobDescription, SKILL_CATALOG };
