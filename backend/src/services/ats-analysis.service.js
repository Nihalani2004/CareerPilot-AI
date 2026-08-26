const crypto = require("crypto");

const ANALYSIS_VERSION = 1;

const SKILL_CATALOG = [
    { key: "javascript", label: "JavaScript", category: "Frontend", aliases: ["javascript", "js"] },
    { key: "typescript", label: "TypeScript", category: "Frontend", aliases: ["typescript", "ts"] },
    { key: "react", label: "React", category: "Frontend", aliases: ["react", "react.js", "reactjs"] },
    { key: "nextjs", label: "Next.js", category: "Frontend", aliases: ["next.js", "nextjs"] },
    { key: "html-css", label: "HTML/CSS", category: "Frontend", aliases: ["html", "css", "html/css"] },
    { key: "nodejs", label: "Node.js", category: "Backend", aliases: ["node.js", "nodejs", "node js"] },
    { key: "express", label: "Express.js", category: "Backend", aliases: ["express", "express.js"] },
    { key: "rest-api", label: "REST APIs", category: "Backend", aliases: ["rest api", "restful api", "rest apis", "restful apis"] },
    { key: "graphql", label: "GraphQL", category: "Backend", aliases: ["graphql"] },
    { key: "mongodb", label: "MongoDB", category: "Database", aliases: ["mongodb", "mongoose"] },
    { key: "mysql", label: "MySQL", category: "Database", aliases: ["mysql"] },
    { key: "postgresql", label: "PostgreSQL", category: "Database", aliases: ["postgresql", "postgres"] },
    { key: "redis", label: "Redis", category: "Database", aliases: ["redis"] },
    { key: "sql", label: "SQL", category: "Database", aliases: ["sql"] },
    { key: "python", label: "Python", category: "Programming", aliases: ["python"] },
    { key: "java", label: "Java", category: "Programming", aliases: ["java"] },
    { key: "c-plus-plus", label: "C++", category: "Programming", aliases: ["c++", "cpp", "c plus plus"] },
    { key: "git", label: "Git", category: "Tools", aliases: ["git", "github", "gitlab"] },
    { key: "docker", label: "Docker", category: "DevOps", aliases: ["docker", "containerization", "containers"] },
    { key: "kubernetes", label: "Kubernetes", category: "DevOps", aliases: ["kubernetes", "k8s"] },
    { key: "aws", label: "AWS", category: "Cloud", aliases: ["aws", "amazon web services"] },
    { key: "azure", label: "Azure", category: "Cloud", aliases: ["azure"] },
    { key: "gcp", label: "Google Cloud", category: "Cloud", aliases: ["gcp", "google cloud"] },
    { key: "jwt", label: "JWT Authentication", category: "Security", aliases: ["jwt", "json web token", "authentication"] },
    { key: "testing", label: "Testing", category: "Quality", aliases: ["testing", "unit test", "integration test", "jest"] },
    { key: "data-structures", label: "Data Structures & Algorithms", category: "Computer Science", aliases: ["data structures", "algorithms", "dsa"] },
    { key: "system-design", label: "System Design", category: "Computer Science", aliases: ["system design", "scalable architecture"] },
    { key: "agile", label: "Agile", category: "Collaboration", aliases: ["agile", "scrum"] },
    { key: "communication", label: "Communication", category: "Collaboration", aliases: ["communication", "collaboration", "teamwork"] },
];

const STANDARD_SECTIONS = [
    { key: "summary", label: "Professional Summary", aliases: ["summary", "profile", "objective", "about me"] },
    { key: "skills", label: "Technical Skills", aliases: ["skills", "technical skills", "technologies"] },
    { key: "experience", label: "Experience", aliases: ["experience", "work experience", "employment", "internship"] },
    { key: "projects", label: "Projects", aliases: ["projects", "project experience"] },
    { key: "education", label: "Education", aliases: ["education", "academic"] },
    { key: "certifications", label: "Certifications", aliases: ["certifications", "certification", "achievements"] },
];

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or", "the", "to", "with",
    "you", "your", "we", "our", "will", "should", "must", "can", "may", "have", "has", "years", "year", "work", "working", "role",
    "candidate", "job", "position", "team", "company", "looking", "required", "preferred", "ability", "strong", "skills", "skill", "experience",
    "knowledge", "using", "build", "develop", "development", "software", "engineering", "engineer", "developer", "responsibilities",
]);

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeText(value = "") {
    return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAlias(text, alias) {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) {
        return false;
    }

    if (/^[a-z0-9 ]+$/.test(normalizedAlias)) {
        return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedAlias)}(?=$|[^a-z0-9])`, "i").test(text);
    }

    return text.includes(normalizedAlias);
}

function findEvidence(text, aliases) {
    const sentences = String(text || "").split(/(?<=[.!?])\s+|\n+/).map((item) => item.trim()).filter(Boolean);
    const matchedSentence = sentences.find((sentence) => aliases.some((alias) => containsAlias(normalizeText(sentence), alias)));

    if (!matchedSentence) {
        return null;
    }

    return matchedSentence.length > 180 ? `${matchedSentence.slice(0, 177).trim()}...` : matchedSentence;
}

function getImportance(jobDescription, aliases) {
    const text = normalizeText(jobDescription);
    const highSignals = ["must have", "mandatory", "required", "essential", "minimum qualification", "strong experience"];
    const mediumSignals = ["preferred", "good to have", "nice to have", "plus", "desired"];
    const aliasIndex = aliases
        .map((alias) => text.indexOf(normalizeText(alias)))
        .find((index) => index >= 0);

    if (aliasIndex === undefined) {
        return "medium";
    }

    const context = text.slice(Math.max(0, aliasIndex - 110), aliasIndex + 110);
    if (highSignals.some((signal) => context.includes(signal))) {
        return "high";
    }
    if (mediumSignals.some((signal) => context.includes(signal))) {
        return "low";
    }
    return "medium";
}

function extractRequirements(jobDescription, candidateText) {
    const normalizedJobDescription = normalizeText(jobDescription);
    const requirements = SKILL_CATALOG
        .filter((skill) => skill.aliases.some((alias) => containsAlias(normalizedJobDescription, alias)))
        .map((skill) => {
            const matched = skill.aliases.some((alias) => containsAlias(candidateText, alias));
            return {
                key: skill.key,
                label: skill.label,
                category: skill.category,
                importance: getImportance(jobDescription, skill.aliases),
                status: matched ? "matched" : "missing",
                evidence: matched ? findEvidence(candidateText, skill.aliases) : null,
            };
        });

    return requirements;
}

function createSkillGapRequirements(skillGaps, requirements, candidateText) {
    const existingKeys = new Set(requirements.map((requirement) => requirement.key));
    const additions = [];

    for (const gap of skillGaps || []) {
        const label = String(gap.skill || "").trim();
        if (!label) {
            continue;
        }

        const catalogEntry = SKILL_CATALOG.find((skill) => skill.aliases.some((alias) => containsAlias(normalizeText(label), alias)));
        const key = catalogEntry?.key || `gap-${normalizeText(label).replace(/[^a-z0-9]+/g, "-")}`;
        if (existingKeys.has(key)) {
            continue;
        }

        const aliases = catalogEntry?.aliases || [label];
        const matched = aliases.some((alias) => containsAlias(candidateText, alias));
        additions.push({
            key,
            label: catalogEntry?.label || label,
            category: catalogEntry?.category || "Role requirement",
            importance: gap.severity === "high" ? "high" : gap.severity === "low" ? "low" : "medium",
            status: matched ? "matched" : "missing",
            evidence: matched ? findEvidence(candidateText, aliases) : null,
        });
        existingKeys.add(key);
    }

    return additions;
}

function extractKeywordCoverage(jobDescription, requirements) {
    const words = normalizeText(jobDescription)
        .match(/[a-z][a-z0-9+#.]{2,}/g) || [];
    const frequencies = new Map();

    for (const word of words) {
        if (!STOP_WORDS.has(word)) {
            frequencies.set(word, (frequencies.get(word) || 0) + 1);
        }
    }

    const catalogWords = new Set(requirements.flatMap((requirement) => normalizeText(requirement.label).split(/\s+/)));
    return [...frequencies.entries()]
        .filter(([word, count]) => count > 1 || catalogWords.has(word))
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 24)
        .map(([word, count]) => ({ word, count }));
}

function buildSectionAnalysis(resume, selfDescription, requirements) {
    const source = normalizeText(resume);
    const hasResume = source.length > 0;
    const matchedRequirements = requirements.filter((requirement) => requirement.status === "matched");
    const relevantEvidenceCount = matchedRequirements.filter((requirement) => requirement.evidence).length;

    return STANDARD_SECTIONS.map((section) => {
        const isPresent = section.aliases.some((alias) => containsAlias(source, alias));
        const fallbackPresent = section.key === "summary" && normalizeText(selfDescription).length >= 40;
        const present = isPresent || fallbackPresent;
        let score = present ? 72 : hasResume ? 32 : 18;
        let insight = present
            ? `${section.label} is present and can be tailored to the target role.`
            : `${section.label} heading was not detected in the submitted resume.`;

        if (section.key === "skills") {
            score = clamp((matchedRequirements.length / Math.max(requirements.length, 1)) * 100);
            insight = matchedRequirements.length
                ? `${matchedRequirements.length} target requirement${matchedRequirements.length === 1 ? " is" : "s are"} evidenced in the candidate profile.`
                : "No target technical requirements were reliably matched in the candidate profile.";
        }

        if (section.key === "projects" || section.key === "experience") {
            score = clamp((relevantEvidenceCount / Math.max(requirements.length, 1)) * 100 + (present ? 25 : 0));
            insight = relevantEvidenceCount
                ? `${relevantEvidenceCount} target requirement${relevantEvidenceCount === 1 ? " has" : "s have"} evidence in the candidate content.`
                : "Add outcome-focused evidence for the technologies required by the target role.";
        }

        return {
            key: section.key,
            label: section.label,
            score,
            status: score >= 70 ? "strong" : score >= 45 ? "needs_attention" : "missing",
            insight,
        };
    });
}

function buildAuditChecklist({ resume, selfDescription, requirements, sections }) {
    const candidateText = normalizeText(`${resume || ""} ${selfDescription || ""}`);
    const matched = requirements.filter((requirement) => requirement.status === "matched").length;
    const detectedSections = sections.filter((section) => section.status !== "missing").length;
    const sourceLength = candidateText.length;

    return [
        {
            key: "extractable-content",
            label: "Extractable candidate content",
            status: sourceLength >= 120 ? "pass" : "warning",
            detail: sourceLength >= 120 ? "Enough candidate text was available for analysis." : "Add a fuller resume or self-description for more reliable insights.",
        },
        {
            key: "standard-headings",
            label: "Standard resume sections",
            status: detectedSections >= 4 ? "pass" : detectedSections >= 2 ? "warning" : "action",
            detail: `${detectedSections} of ${STANDARD_SECTIONS.length} standard sections were detected.`,
        },
        {
            key: "role-keyword-coverage",
            label: "Role keyword coverage",
            status: matched >= Math.max(2, Math.ceil(requirements.length * 0.6)) ? "pass" : "warning",
            detail: requirements.length ? `${matched} of ${requirements.length} identified role requirements are evidenced.` : "No catalogued technical requirements were extracted from this job description.",
        },
        {
            key: "concise-content",
            label: "Concise, readable content",
            status: sourceLength >= 350 && sourceLength <= 15000 ? "pass" : "warning",
            detail: sourceLength > 15000 ? "The candidate content is long; keep resume sections concise and scannable." : "Use concise, evidence-based bullet points for stronger readability.",
        },
    ];
}

function createSuggestions(requirements, sections) {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const suggestions = [];

    for (const requirement of requirements.filter((item) => item.status === "missing")) {
        suggestions.push({
            id: `requirement-${requirement.key}`,
            section: requirement.category === "Collaboration" ? "Experience" : "Skills",
            priority: requirement.importance,
            title: `Address ${requirement.label}`,
            detail: `This ${requirement.importance}-priority role requirement is not evidenced in the submitted candidate content. Add it only when you have genuine experience, project work, coursework, or active learning evidence.`,
            relatedKeywords: [requirement.label],
            status: "open",
        });
    }

    for (const section of sections.filter((item) => item.status !== "strong")) {
        suggestions.push({
            id: `section-${section.key}`,
            section: section.label,
            priority: section.status === "missing" ? "high" : "medium",
            title: `Strengthen ${section.label}`,
            detail: section.status === "missing"
                ? `Add a clear ${section.label} section using a standard heading so recruiters and parsing systems can identify it quickly.`
                : `Use concise, role-relevant evidence in ${section.label}; connect responsibilities and projects to the target job requirements.`,
            relatedKeywords: [],
            status: "open",
        });
    }

    return suggestions
        .sort((left, right) => priorityWeight[right.priority] - priorityWeight[left.priority])
        .slice(0, 12);
}

function buildAtsAnalysis({ resume = "", selfDescription = "", jobDescription = "", title = "", skillGaps = [], matchScore }) {
    const candidateText = normalizeText(`${resume} ${selfDescription}`);
    const coreRequirements = extractRequirements(jobDescription, candidateText);
    const requirements = [...coreRequirements, ...createSkillGapRequirements(skillGaps, coreRequirements, candidateText)];
    const matchedRequirements = requirements.filter((requirement) => requirement.status === "matched");
    const weightedTotal = requirements.reduce((total, requirement) => total + ({ high: 3, medium: 2, low: 1 }[requirement.importance] || 1), 0);
    const weightedMatched = matchedRequirements.reduce((total, requirement) => total + ({ high: 3, medium: 2, low: 1 }[requirement.importance] || 1), 0);
    const keywordAlignment = requirements.length ? clamp((weightedMatched / weightedTotal) * 100) : 0;
    const sections = buildSectionAnalysis(resume, selfDescription, requirements);
    const completeness = clamp(sections.reduce((total, section) => total + section.score, 0) / sections.length);
    const evidenceQuality = requirements.length
        ? clamp((matchedRequirements.filter((requirement) => requirement.evidence).length / requirements.length) * 100)
        : 0;
    const skillAlignment = requirements.length ? clamp((matchedRequirements.length / requirements.length) * 100) : 0;
    const overallScore = clamp((keywordAlignment * 0.42) + (skillAlignment * 0.28) + (evidenceQuality * 0.18) + (completeness * 0.12));

    const auditChecklist = buildAuditChecklist({ resume, selfDescription, requirements, sections });
    const suggestions = createSuggestions(requirements, sections);

    return {
        analysisVersion: ANALYSIS_VERSION,
        targetRole: title || "Target role",
        sourceHash: createAtsSourceHash({ resume, selfDescription, jobDescription, title, skillGaps, matchScore }),
        metrics: {
            overallScore,
            keywordAlignment,
            skillAlignment,
            evidenceQuality,
            completeness,
            existingMatchScore: typeof matchScore === "number" ? clamp(matchScore) : null,
        },
        requirements,
        keywordCoverage: extractKeywordCoverage(jobDescription, requirements),
        sections,
        auditChecklist,
        suggestions,
    };
}

function createAtsSourceHash({ resume = "", selfDescription = "", jobDescription = "", title = "", skillGaps = [], matchScore = null }) {
    const source = JSON.stringify({
        resume: normalizeText(resume),
        selfDescription: normalizeText(selfDescription),
        jobDescription: normalizeText(jobDescription),
        title: normalizeText(title),
        skillGaps: (skillGaps || []).map((gap) => ({ skill: normalizeText(gap.skill), severity: gap.severity })).sort((left, right) => left.skill.localeCompare(right.skill)),
        matchScore,
        version: ANALYSIS_VERSION,
    });
    return crypto.createHash("sha256").update(source).digest("hex");
}

module.exports = {
    ANALYSIS_VERSION,
    buildAtsAnalysis,
    createAtsSourceHash,
};
