const crypto = require("crypto");
const { getResourcesForTopic } = require("./learning-resource-catalog.service");

const PRIORITY_BY_SEVERITY = { high: "high", medium: "medium", low: "low" };
const MAX_TASKS = 24;

function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function createRoadmapSourceHash({ report, atsAnalysis, settings }) {
    const input = {
        roadmapVersion: 1,
        reportId: report._id.toString(),
        resume: normalizeText(report.resume),
        selfDescription: normalizeText(report.selfDescription),
        jobDescription: normalizeText(report.jobDescription),
        skillGaps: (report.skillGaps || []).map((item) => ({ skill: normalizeText(item.skill), severity: item.severity })),
        preparationPlan: (report.preparationPlan || []).map((item) => ({ day: item.day, focus: normalizeText(item.focus) })),
        atsRequirements: (atsAnalysis?.requirements || []).filter((item) => item.status === "missing").map((item) => item.label),
        settings,
    };

    return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function scheduleTasks(tasks, settings) {
    const start = startOfDay(settings.startDate);
    const availableDays = Math.max(settings.durationWeeks * 5, 1);

    return tasks.map((task, index) => {
        const slot = index % availableDays;
        const scheduledDate = new Date(start);
        scheduledDate.setDate(start.getDate() + (Math.floor(slot / 5) * 7) + (slot % 5));
        return {
            ...task,
            week: Math.floor(slot / 5) + 1,
            day: (slot % 5) + 1,
            scheduledDate,
        };
    });
}

function createSkillTasks(skillGap) {
    const skill = normalizeText(skillGap.skill);
    const priority = PRIORITY_BY_SEVERITY[skillGap.severity] || "medium";
    const resources = getResourcesForTopic(skill);

    return [
        {
            title: `Strengthen ${skill} fundamentals`,
            description: `Review the core concepts required for ${skill}, then write a short explanation in your own words before moving to practical work.`,
            category: "skill_gap",
            taskType: "learn",
            priority,
            estimatedMinutes: priority === "high" ? 90 : 60,
            resources,
            sourceEvidence: { skillGap: skill },
        },
        {
            title: `Practice ${skill} with a concrete outcome`,
            description: `Apply ${skill} in an exercise, a small implementation, or an improvement to an existing project. Record what you learned and what remains unclear.`,
            category: "skill_gap",
            taskType: priority === "high" ? "build" : "practice",
            priority,
            estimatedMinutes: priority === "high" ? 120 : 75,
            resources,
            sourceEvidence: { skillGap: skill },
        },
    ];
}

function createPreparationTasks(preparationPlan) {
    return (preparationPlan || []).slice(0, 4).map((item) => ({
        title: `Interview practice: ${normalizeText(item.focus)}`,
        description: `Complete the planned preparation activity for Day ${item.day} and rehearse how you would explain your approach in an interview.`,
        category: "technical",
        taskType: "mock_interview",
        priority: "medium",
        estimatedMinutes: 45,
        resources: getResourcesForTopic("interview"),
        sourceEvidence: { interviewDay: item.day },
    }));
}

function createAtsTasks(atsAnalysis) {
    return (atsAnalysis?.requirements || [])
        .filter((requirement) => requirement.status === "missing")
        .filter((requirement) => requirement.importance === "high" || requirement.importance === "medium")
        .slice(0, 3)
        .map((requirement) => ({
            title: `Build genuine evidence for ${normalizeText(requirement.label)}`,
            description: `Create or document authentic evidence for this role requirement. Update your resume only after you can support the claim with real work, learning, or results.`,
            category: "ats_evidence",
            taskType: "build",
            priority: requirement.importance === "high" ? "high" : "medium",
            estimatedMinutes: requirement.importance === "high" ? 90 : 60,
            resources: getResourcesForTopic(requirement.label),
            sourceEvidence: { atsRequirement: requirement.label },
        }));
}

function createPortfolioTasks(skillGaps) {
    const highestPriorityGap = skillGaps[0];
    if (!highestPriorityGap) return [];
    const skill = normalizeText(highestPriorityGap.skill);
    return [{
        title: `Show portfolio proof for ${skill}`,
        description: `Document a real implementation, project contribution, or learning artifact that demonstrates ${skill}. Keep the evidence specific and truthful.`,
        category: "portfolio",
        taskType: "build",
        priority: PRIORITY_BY_SEVERITY[highestPriorityGap.severity] || "medium",
        estimatedMinutes: 90,
        resources: getResourcesForTopic(skill),
        sourceEvidence: { skillGap: skill },
    }];
}

function getTaskBudget(settings) {
    const availableMinutes = settings.durationWeeks * settings.hoursPerWeek * 60;
    const intensityMultiplier = { light: 0.75, balanced: 1, intensive: 1.25 }[settings.intensity] || 1;
    return Math.max(6, Math.min(MAX_TASKS, Math.floor((availableMinutes * intensityMultiplier) / 75)));
}

function buildLearningRoadmap({ report, atsAnalysis, settings }) {
    const enabledFocus = new Set(settings.focusAreas || []);
    const tasks = [];
    const skillGaps = [...(report.skillGaps || [])]
        .sort((left, right) => ({ high: 0, medium: 1, low: 2 }[left.severity] - ({ high: 0, medium: 1, low: 2 }[right.severity])))
        .slice(0, 6);

    if (enabledFocus.has("skill_gaps") || !enabledFocus.size) {
        skillGaps.forEach((skillGap) => tasks.push(...createSkillTasks(skillGap)));
    }
    if (enabledFocus.has("ats_evidence")) tasks.push(...createAtsTasks(atsAnalysis));
    if (enabledFocus.has("technical_interview") || enabledFocus.has("behavioral_interview")) {
        tasks.push(...createPreparationTasks(report.preparationPlan));
    }
    if (enabledFocus.has("portfolio")) tasks.push(...createPortfolioTasks(skillGaps));

    if (!tasks.length) {
        tasks.push({
            title: `Review the requirements for ${normalizeText(report.title) || "your target role"}`,
            description: "Identify the strongest evidence already present in your experience and prepare concise examples for an interview.",
            category: "technical",
            taskType: "review",
            priority: "medium",
            estimatedMinutes: 45,
            resources: getResourcesForTopic("interview"),
            sourceEvidence: {},
        });
    }

    const selectedTasks = tasks.slice(0, getTaskBudget(settings));
    const scheduledTasks = scheduleTasks(selectedTasks, settings);
    const criticalGaps = skillGaps.filter((gap) => gap.severity === "high").map((gap) => normalizeText(gap.skill)).slice(0, 4);

    return {
        sourceHash: createRoadmapSourceHash({ report, atsAnalysis, settings }),
        title: `${normalizeText(report.title) || "Interview"} Learning Roadmap`,
        summary: {
            criticalGaps,
            estimatedTotalMinutes: scheduledTasks.reduce((total, task) => total + task.estimatedMinutes, 0),
            taskCount: scheduledTasks.length,
        },
        tasks: scheduledTasks,
    };
}

function rescheduleTasks(tasks, startDate) {
    const incompleteTasks = tasks.filter((task) => task.status === "todo" || task.status === "in_progress");
    const scheduled = scheduleTasks(incompleteTasks.map((task) => task.toObject ? task.toObject() : task), { durationWeeks: Math.max(...incompleteTasks.map((task) => task.week), 1), startDate });
    return new Map(scheduled.map((task) => [task._id.toString(), task]));
}

module.exports = { buildLearningRoadmap, createRoadmapSourceHash, rescheduleTasks };
