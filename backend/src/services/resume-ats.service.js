const crypto = require("crypto");

// Increment when scoring semantics change so an older cached scan is never
// returned as though it had been evaluated by the current rubric.
const ANALYSIS_VERSION = 3;
const DISCLAIMER = "This is an ATS-readiness estimate based on resume parsing and content checks. It is not a hiring prediction or a score from an employer's ATS.";

const SECTION_DEFINITIONS = [
    { key: "summary", label: "Professional summary", aliases: ["summary", "professional summary", "career summary", "profile", "professional profile", "objective", "career objective", "about me"] },
    { key: "skills", label: "Technical skills", aliases: ["skills", "technical skills", "skills and technologies", "skills and tools", "technologies", "core competencies"] },
    { key: "experience", label: "Experience or projects", aliases: ["experience", "professional experience", "work experience", "work history", "employment", "internship", "projects", "project experience", "professional projects"] },
    { key: "education", label: "Education", aliases: ["education", "education and qualifications", "academic", "academic background", "qualifications"] },
    { key: "certifications", label: "Certifications", aliases: ["certifications", "certification", "certifications and achievements", "achievements", "courses and certifications"] },
];

const SKILL_PATTERNS = [
    ["JavaScript", ["javascript"]], ["TypeScript", ["typescript"]], ["React", ["react", "react.js"]], ["Node.js", ["node.js", "nodejs"]],
    ["Express.js", ["express", "express.js"]], ["MongoDB", ["mongodb"]], ["SQL", ["sql", "mysql", "postgresql"]], ["Python", ["python"]],
    ["Java", ["java"]], ["C++", ["c++", "cpp"]], ["REST APIs", ["rest api", "restful"]], ["Git", ["git", "github"]],
    ["Docker", ["docker"]], ["AWS", ["aws", "amazon web services"]], ["Testing", ["jest", "testing", "unit test"]],
    ["Data Structures & Algorithms", ["data structures", "algorithms", "dsa"]], ["System Design", ["system design"]],
    ["Next.js", ["next.js", "nextjs"]], ["Angular", ["angular"]], ["Vue.js", ["vue.js", "vuejs"]], ["HTML/CSS", ["html", "css"]],
    ["Redux", ["redux"]], ["GraphQL", ["graphql"]], ["Postman", ["postman"]], ["Linux", ["linux"]],
    ["Kubernetes", ["kubernetes", "k8s"]], ["CI/CD", ["ci/cd", "continuous integration", "continuous deployment"]], ["Azure", ["azure"]], ["GCP", ["google cloud", "gcp"]],
    ["Figma", ["figma"]], ["Agile", ["agile", "scrum"]], ["Machine Learning", ["machine learning", "ml"]], ["Data Analysis", ["data analysis", "pandas", "power bi"]],
];

const ACTION_VERBS = ["built", "developed", "designed", "implemented", "engineered", "optimized", "improved", "created", "led", "delivered", "integrated", "automated", "deployed", "reduced", "increased"];

function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
function normalizeText(value = "") { return String(value).replace(/\r/g, "").replace(/\s+/g, " ").trim(); }
function normalizedLines(value = "") { return String(value).replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function hasPhrase(text, phrase) { return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase.toLowerCase())}(?=$|[^a-z0-9])`, "i").test(text); }
function isSectionHeading(line, aliases) {
    const normalized = String(line || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    // Restrict section detection to a complete heading line. This avoids
    // granting section credit when a keyword only appears inside a sentence.
    return normalized.length <= 48 && aliases.some((alias) => normalized === alias || normalized.startsWith(`${alias} `) || normalized.endsWith(` ${alias}`));
}
function scoreLabel(score) { return score >= 85 ? "ATS-ready structure" : score >= 70 ? "Good foundation" : score >= 50 ? "Needs focused improvements" : "High ATS risk"; }
function isBulletLine(line) { return /^(?:[-*\u2022\u25AA\u25E6]|\d+[.)])\s+/.test(line); }
function bulletText(line) { return String(line).replace(/^(?:[-*\u2022\u25AA\u25E6]|\d+[.)])\s+/, "").trim(); }
function isActionLedBullet(line) { return ACTION_VERBS.some((verb) => hasPhrase(bulletText(line).split(/\s+/).slice(0, 2).join(" ").toLowerCase(), verb)); }
function idealRangeScore(value, lowerBound, upperBound) {
    if (!value) return 0;
    if (value < lowerBound) return clamp((value / lowerBound) * 100);
    if (value > upperBound) return clamp((upperBound / value) * 100);
    return 100;
}
function buildRecommendations(findings) {
    const uniqueCategories = new Set();
    const recommendations = [];
    for (const finding of findings) {
        if (uniqueCategories.has(finding.category) || recommendations.length === 3) continue;
        uniqueCategories.add(finding.category);
        recommendations.push({ focus: finding.title, priority: finding.priority, why: finding.evidence || finding.category, action: finding.detail });
    }
    return recommendations.length ? recommendations : [{ focus: "Tailor the resume to every role", priority: "low", why: "The structural checks found no immediate high-priority issue.", action: "Use the Job Description ATS Intelligence report before each application to align only genuine skills and experience with the target role." }];
}

function createContentHash(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

function buildResumeAtsAnalysis(resumeText) {
    const text = normalizeText(resumeText);
    const lowerText = text.toLowerCase();
    const lines = normalizedLines(resumeText);
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const shortLines = lines.filter((line) => line.length <= 2).length;
    const fragmentedLineRatio = lines.length ? clamp((shortLines / lines.length) * 100) : 100;
    const longLineRatio = lines.length ? clamp((lines.filter((line) => line.length > 180).length / lines.length) * 100) : 100;
    const corruptionCount = (text.match(/\uFFFD/g) || []).length;
    const readableCharacters = (text.match(/[\p{L}\p{N}\s.,;:()/%+&@#'’\-]/gu) || []).length;
    const readableRatio = text.length ? readableCharacters / text.length : 0;
    const contentLengthScore = idealRangeScore(wordCount, 250, 1100);
    const parserScore = !text ? 0 : clamp((contentLengthScore * .45) + (readableRatio * 30) + (fragmentedLineRatio <= 18 ? 15 : Math.max(0, 15 - fragmentedLineRatio)) + (longLineRatio <= 15 ? 7 : Math.max(0, 7 - longLineRatio / 3)) + (corruptionCount ? 0 : 3));

    const sections = SECTION_DEFINITIONS.map((section) => ({
        key: section.key,
        label: section.label,
        present: lines.some((line) => isSectionHeading(line, section.aliases)),
    }));
    const requiredSections = sections.slice(0, 4);
    const sectionScore = clamp((requiredSections.filter((section) => section.present).length / requiredSections.length) * 80 + (sections.find((section) => section.key === "certifications").present ? 20 : 0));

    const headingCount = sections.filter((section) => section.present).length;
    const symbolRatio = text.length ? ((text.match(/[^\p{L}\p{N}\s.,;:()/%+&@#'’\-]/gu) || []).length / text.length) : 1;
    const bulletCount = lines.filter((line) => /^(?:[-*•▪◦]|\d+[.)])\s+/.test(line)).length;
    const formattingScore = !text ? 0 : clamp((headingCount / 5) * 45 + (bulletCount >= 3 ? 18 : bulletCount * 6) + (fragmentedLineRatio <= 18 ? 25 : Math.max(0, 25 - fragmentedLineRatio)) + (symbolRatio <= .035 ? 12 : Math.max(0, 12 - symbolRatio * 180)));
    const detectedBulletLines = lines.filter(isBulletLine);
    const detectedBulletCount = detectedBulletLines.length;
    const actionLedBulletCount = detectedBulletLines.filter(isActionLedBullet).length;
    const enhancedFormattingScore = !text ? 0 : clamp((headingCount / 5) * 35 + Math.min(detectedBulletCount / 4, 1) * 22 + Math.min(actionLedBulletCount / 3, 1) * 16 + (fragmentedLineRatio <= 18 ? 15 : Math.max(0, 15 - fragmentedLineRatio)) + (symbolRatio <= .035 ? 12 : Math.max(0, 12 - symbolRatio * 180)));

    const contacts = {
        email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text),
        phone: /(?:\+?\d[\d\s().-]{8,}\d)/.test(text),
        linkedin: /linkedin\.com\/[\w/-]+/i.test(text),
        githubOrPortfolio: /github\.com\/[\w/-]+|https?:\/\/(?![^\s/]*linkedin\.com)[^\s]+/i.test(text),
    };
    const contactScore = clamp((Object.values(contacts).filter(Boolean).length / 4) * 100);

    const actionVerbCount = ACTION_VERBS.filter((verb) => hasPhrase(lowerText, verb)).length;
    const metricCount = (text.match(/\b\d+(?:\.\d+)?\s?(?:%|x|ms|seconds?|minutes?|hours?|users?|requests?|projects?|days?|months?|years?)\b/gi) || []).length;
    const dateSignalCount = new Set(text.match(/\b(?:19|20)\d{2}\b/g) || []).size;
    const timelineRangeCount = (text.match(/\b(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,]*)?(?:19|20)\d{2}\s*(?:-|to)\s*(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,]*)?(?:present|current|(?:19|20)\d{2})\b/gi) || []).length;
    const evidenceScore = clamp(Math.min(actionVerbCount / 5, 1) * 30 + Math.min(actionLedBulletCount / 3, 1) * 25 + Math.min(metricCount / 3, 1) * 30 + Math.min(timelineRangeCount / 2, 1) * 15);
    const skills = SKILL_PATTERNS.filter(([, aliases]) => aliases.some((alias) => hasPhrase(lowerText, alias))).map(([label]) => label);
    const skillsScore = clamp(Math.min(skills.length / 8, 1) * 70 + (sections.find((section) => section.key === "skills").present ? 30 : 0));

    const overallScore = clamp((parserScore * .18) + (sectionScore * .22) + (enhancedFormattingScore * .18) + (contactScore * .10) + (evidenceScore * .20) + (skillsScore * .12));
    const findings = [];
    const addFinding = (id, category, priority, title, detail, scoreImpact, evidence = null) => findings.push({ id, category, priority, title, detail, scoreImpact, evidence });
    if (!text || wordCount < 80) addFinding("parser-text", "Parser health", "critical", "Resume text is not reliably extractable", "The PDF yielded very little readable text. Use a text-based PDF instead of an image-only scan.", 20);
    if (text && wordCount >= 80 && wordCount < 220) addFinding("content-sparse", "Content quality", "high", "Resume content is sparse", "Add concise detail to projects, experience, skills, and education so the parser has enough evidence to evaluate.", 8, `${wordCount} words detected`);
    if (text && wordCount >= 220 && wordCount < 250) addFinding("content-length", "Content quality", "medium", "Add a little more role-relevant detail", "Add focused achievement bullets for your most relevant projects or experience so the resume gives reviewers enough evidence without becoming repetitive.", 4, `${wordCount} words detected`);
    if (wordCount > 1100) addFinding("content-long", "Content quality", "medium", "Resume may be difficult to scan quickly", "Condense repeated detail and prioritize the most relevant projects, experience, and measurable outcomes.", 4, `${wordCount} words detected`);
    if (fragmentedLineRatio > 18) addFinding("fragmented-lines", "Formatting", "high", "Text appears fragmented", "Short or broken text lines can indicate a complex layout that some parsers handle poorly. Use a single-column, text-based layout.", 12, `${fragmentedLineRatio}% short lines detected`);
    if (longLineRatio > 35) addFinding("dense-lines", "Formatting", "medium", "Break dense paragraphs into shorter bullets", "Split long project and experience paragraphs into concise bullets so both recruiters and parsers can identify each accomplishment.", 5, `${longLineRatio}% long lines detected`);
    if (corruptionCount) addFinding("text-corruption", "Parser health", "high", "Fix unreadable characters", "Re-export the source file as a text-based PDF or DOCX because replacement characters can hide skills and contact details from parsers.", 10, `${corruptionCount} replacement characters detected`);
    if (detectedBulletCount < 3) addFinding("bullet-structure", "Formatting", "medium", "Use consistent achievement bullets", "Use short bullet points under projects and experience to help scanners separate accomplishments and responsibilities.", 5, `${detectedBulletCount} bullet lines detected`);
    requiredSections.filter((section) => !section.present).forEach((section) => addFinding(`section-${section.key}`, "Sections", "high", `Add a clear ${section.label.toLowerCase()} section`, "Use a conventional section heading so applicant-tracking systems and recruiters can find this information consistently.", 8));
    if (!contacts.email) addFinding("contact-email", "Contact details", "high", "Add a professional email address", "An email address was not detected in the extracted resume text.", 6);
    if (!contacts.phone) addFinding("contact-phone", "Contact details", "medium", "Add a phone number", "A phone number was not detected in the extracted resume text.", 4);
    if (!contacts.linkedin) addFinding("contact-linkedin", "Contact details", "low", "Add a LinkedIn URL", "A LinkedIn profile URL was not detected. Add one if it represents your professional work.", 2);
    if (metricCount < 2) addFinding("evidence-metrics", "Evidence quality", "medium", "Quantify outcomes", "Add measurable outcomes to projects or experience, such as response-time improvement, users served, or delivery scope.", 7);
    if (actionVerbCount < 3) addFinding("evidence-actions", "Evidence quality", "medium", "Strengthen achievement language", "Begin experience and project bullets with specific action verbs and explain what you built or improved.", 5);
    if (actionLedBulletCount < 2) addFinding("achievement-bullets", "Evidence quality", "medium", "Lead bullets with clear actions", "Start each key bullet with an action verb such as Built, Improved, Designed, or Reduced, then add the result or scope.", 5, `${actionLedBulletCount} action-led bullet lines detected`);
    if (timelineRangeCount < 1 || dateSignalCount < 2) addFinding("chronology-dates", "Timeline clarity", "low", "Make timelines easy to parse", "Include clear month/year or year ranges for education, internships, employment, and major projects.", 3);
    if (!sections.find((section) => section.key === "skills").present || skills.length < 4) addFinding("skills-clarity", "Skills", "medium", "Make technical skills easier to scan", "Use a clearly named Technical Skills section with relevant technologies grouped by category.", 5);
    const sortedFindings = findings.sort((left, right) => ({ critical: 0, high: 1, medium: 2, low: 3 }[left.priority] - { critical: 0, high: 1, medium: 2, low: 3 }[right.priority]));
    const recommendations = buildRecommendations(sortedFindings);

    return {
        overallScore,
        label: scoreLabel(overallScore),
        disclaimer: DISCLAIMER,
        scores: [
            { key: "parser", label: "Parseability & file health", score: parserScore, summary: text ? `${wordCount} words were extracted; content length and text quality were checked.` : "No readable resume text was extracted." },
            { key: "sections", label: "Essential sections", score: sectionScore, summary: `${requiredSections.filter((section) => section.present).length} of ${requiredSections.length} core sections were detected.` },
            { key: "formatting", label: "ATS-friendly structure", score: enhancedFormattingScore, summary: `${headingCount} recognized headings, ${detectedBulletCount} bullet lines, and ${actionLedBulletCount} action-led bullets were detected.` },
            { key: "contact", label: "Contact details", score: contactScore, summary: `${Object.values(contacts).filter(Boolean).length} of 4 professional contact signals were detected.` },
            { key: "evidence", label: "Evidence & achievement quality", score: evidenceScore, summary: `${actionVerbCount} action verbs, ${metricCount} measurable outcomes, and ${timelineRangeCount} date ranges were detected.` },
            { key: "skills", label: "Skills clarity", score: skillsScore, summary: `${skills.length} recognized technical skills were detected.` },
        ],
        parserHealth: { textExtracted: Boolean(text), characterCount: text.length, wordCount, lineCount: lines.length, fragmentedLineRatio, preview: text.slice(0, 1800) || "No readable text was extracted from this PDF." },
        contacts,
        sections,
        skills,
        findings: sortedFindings,
        recommendations,
        generatedAt: new Date(),
    };
}

module.exports = { ANALYSIS_VERSION, buildResumeAtsAnalysis, createContentHash, DISCLAIMER };
