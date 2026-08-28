const mongoose = require("mongoose");
const learningRoadmapModel = require("../models/learningRoadmap.model");
const learningTaskModel = require("../models/learningTask.model");
const interviewReportModel = require("../models/interviewReport.model");
const atsAnalysisModel = require("../models/atsAnalysis.model");
const { buildLearningRoadmap, rescheduleTasks } = require("../services/learning-roadmap.service");
const { calculateRoadmapReadiness } = require("../services/roadmap-readiness.service");
const { getYouTubeResourcesForTopic } = require("../services/learning-resource-catalog.service");
const { buildCursorFilter, decodeReportCursor, encodeReportCursor, parseReportPageLimit } = require("../services/report-pagination.service");

const VALID_FOCUS_AREAS = new Set(["skill_gaps", "ats_evidence", "technical_interview", "behavioral_interview", "portfolio"]);
const VALID_TASK_STATUSES = new Set(["todo", "in_progress", "completed", "skipped"]);

function getUserId(req) {
    return req.user.id || req.user._id;
}

function sendError(res, status, message) {
    return res.status(status).json({ message });
}

function parseSettings(input = {}) {
    const durationWeeks = Number(input.durationWeeks || 4);
    const hoursPerWeek = Number(input.hoursPerWeek || 6);
    const intensity = input.intensity || "balanced";
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const focusAreas = Array.isArray(input.focusAreas) && input.focusAreas.length
        ? [...new Set(input.focusAreas)]
        : ["skill_gaps", "ats_evidence", "technical_interview"];

    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 6) throw new Error("durationWeeks must be between 1 and 6.");
    if (!Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 40) throw new Error("hoursPerWeek must be between 1 and 40.");
    if (!["light", "balanced", "intensive"].includes(intensity)) throw new Error("intensity is invalid.");
    if (Number.isNaN(startDate.getTime())) throw new Error("startDate is invalid.");
    if (focusAreas.some((area) => !VALID_FOCUS_AREAS.has(area))) throw new Error("focusAreas contains an invalid value.");

    startDate.setHours(0, 0, 0, 0);
    return { durationWeeks, hoursPerWeek, intensity, startDate, focusAreas };
}

async function refreshReadiness(roadmapId) {
    const tasks = await learningTaskModel.find({ roadmap: roadmapId }).select("priority status scheduledDate").lean();
    const readiness = calculateRoadmapReadiness(tasks);
    await learningRoadmapModel.findByIdAndUpdate(roadmapId, { $set: { readiness } });
    return readiness;
}

async function getOwnedRoadmap(roadmapId, userId) {
    if (!mongoose.isValidObjectId(roadmapId)) return null;
    return learningRoadmapModel.findOne({ _id: roadmapId, user: userId });
}

function getTaskResourceTopic(task) {
    if (task.sourceEvidence?.skillGap) return task.sourceEvidence.skillGap;
    if (task.sourceEvidence?.atsRequirement) return task.sourceEvidence.atsRequirement;
    if (task.category === "technical" || task.category === "behavioral") return "interview";
    return task.title;
}

async function appendMissingYouTubeResources(tasks) {
    const operations = [];

    for (const task of tasks) {
        const existingIds = new Set((task.resources || []).map((resource) => resource.resourceId));
        const additions = getYouTubeResourcesForTopic(getTaskResourceTopic(task))
            .filter((resource) => !existingIds.has(resource.resourceId));
        if (!additions.length) continue;

        task.resources = [...(task.resources || []), ...additions];
        operations.push({
            updateOne: {
                filter: { _id: task._id },
                update: { $push: { resources: { $each: additions } } },
            },
        });
    }

    if (operations.length) await learningTaskModel.bulkWrite(operations);
    return tasks;
}

async function createLearningRoadmapController(req, res) {
    try {
        const userId = getUserId(req);
        const { interviewReportId } = req.body || {};
        if (!mongoose.isValidObjectId(interviewReportId)) return sendError(res, 400, "A valid interviewReportId is required.");

        const settings = parseSettings(req.body);
        const report = await interviewReportModel.findOne({ _id: interviewReportId, user: userId })
            .select("resume selfDescription jobDescription title skillGaps preparationPlan createdAt")
            .lean();
        if (!report) return sendError(res, 404, "Interview report not found.");

        const atsAnalysis = await atsAnalysisModel.findOne({ interviewReport: report._id, user: userId }).lean();
        const generated = buildLearningRoadmap({ report, atsAnalysis, settings });
        const existing = await learningRoadmapModel.findOne({ user: userId, sourceHash: generated.sourceHash, status: { $ne: "archived" } });
        if (existing) return res.status(200).json({ message: "Existing learning roadmap returned.", cached: true, roadmap: existing });

        const roadmap = await learningRoadmapModel.create({
            user: userId,
            title: generated.title,
            source: {
                interviewReport: report._id,
                atsAnalysis: atsAnalysis?._id || null,
                targetRole: report.title || "Target role",
                jobDescriptionHash: generated.sourceHash,
                reportCreatedAt: report.createdAt,
            },
            settings,
            summary: generated.summary,
            sourceHash: generated.sourceHash,
        });

        try {
            await learningTaskModel.insertMany(generated.tasks.map((task) => ({ ...task, roadmap: roadmap._id, user: userId })));
            const readiness = await refreshReadiness(roadmap._id);
            roadmap.readiness = readiness;
            return res.status(201).json({ message: "Learning roadmap created successfully.", cached: false, roadmap });
        } catch (error) {
            await learningRoadmapModel.findByIdAndDelete(roadmap._id);
            throw error;
        }
    } catch (error) {
        return sendError(res, 400, error.message || "Failed to create learning roadmap.");
    }
}

async function listLearningRoadmapsController(req, res) {
    try {
        const limit = parseReportPageLimit(req.query.limit);
        const cursor = decodeReportCursor(req.query.cursor);
        const query = { user: getUserId(req), ...buildCursorFilter(cursor) };
        if (["active", "completed", "archived"].includes(req.query.status)) query.status = req.query.status;
        if (req.query.search) query.title = { $regex: String(req.query.search).trim().slice(0, 80), $options: "i" };

        const rows = await learningRoadmapModel.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
        const hasNextPage = rows.length > limit;
        const roadmaps = hasNextPage ? rows.slice(0, limit) : rows;
        return res.status(200).json({
            message: "Learning roadmaps fetched successfully.",
            roadmaps,
            pagination: { limit, hasNextPage, nextCursor: hasNextPage ? encodeReportCursor(roadmaps.at(-1)) : null },
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Failed to fetch learning roadmaps.");
    }
}

async function getLearningRoadmapController(req, res) {
    try {
        const roadmap = await getOwnedRoadmap(req.params.roadmapId, getUserId(req));
        if (!roadmap) return sendError(res, 404, "Learning roadmap not found.");
        const tasks = await learningTaskModel.find({ roadmap: roadmap._id, user: getUserId(req) })
            .sort({ week: 1, day: 1, priority: 1, _id: 1 }).lean();
        await appendMissingYouTubeResources(tasks);
        return res.status(200).json({ message: "Learning roadmap fetched successfully.", roadmap, tasks });
    } catch {
        return sendError(res, 500, "Failed to fetch learning roadmap.");
    }
}

async function updateLearningRoadmapController(req, res) {
    try {
        const roadmap = await getOwnedRoadmap(req.params.roadmapId, getUserId(req));
        if (!roadmap) return sendError(res, 404, "Learning roadmap not found.");
        const updates = {};
        if (typeof req.body?.title === "string") {
            const title = req.body.title.trim();
            if (!title || title.length > 100) return sendError(res, 400, "title must be between 1 and 100 characters.");
            updates.title = title;
        }
        if (req.body?.status && ["active", "completed", "archived"].includes(req.body.status)) updates.status = req.body.status;
        if (!Object.keys(updates).length) return sendError(res, 400, "No valid roadmap updates were provided.");
        Object.assign(roadmap, updates);
        await roadmap.save();
        return res.status(200).json({ message: "Learning roadmap updated successfully.", roadmap });
    } catch {
        return sendError(res, 500, "Failed to update learning roadmap.");
    }
}

async function updateLearningTaskController(req, res) {
    try {
        const userId = getUserId(req);
        const roadmap = await getOwnedRoadmap(req.params.roadmapId, userId);
        if (!roadmap || roadmap.status === "archived") return sendError(res, 404, "Active learning roadmap not found.");
        if (!mongoose.isValidObjectId(req.params.taskId)) return sendError(res, 400, "Task ID is invalid.");
        const task = await learningTaskModel.findOne({ _id: req.params.taskId, roadmap: roadmap._id, user: userId });
        if (!task) return sendError(res, 404, "Learning task not found.");

        const { status, actualMinutes, note, confidence } = req.body || {};
        if (status !== undefined) {
            if (!VALID_TASK_STATUSES.has(status)) return sendError(res, 400, "Task status is invalid.");
            task.status = status;
            task.completedAt = status === "completed" ? new Date() : null;
        }
        if (actualMinutes !== undefined) {
            if (!Number.isInteger(actualMinutes) || actualMinutes < 0 || actualMinutes > 1440) return sendError(res, 400, "actualMinutes must be between 0 and 1440.");
            task.actualMinutes = actualMinutes;
        }
        if (note !== undefined) {
            if (typeof note !== "string" || note.length > 1000) return sendError(res, 400, "note must be a maximum of 1000 characters.");
            task.note = note.trim();
        }
        if (confidence !== undefined) {
            if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) return sendError(res, 400, "confidence must be between 1 and 5.");
            task.confidence = confidence;
        }
        await task.save();
        const readiness = await refreshReadiness(roadmap._id);
        return res.status(200).json({ message: "Learning task updated successfully.", task, readiness });
    } catch {
        return sendError(res, 500, "Failed to update learning task.");
    }
}

async function rescheduleLearningRoadmapController(req, res) {
    try {
        const roadmap = await getOwnedRoadmap(req.params.roadmapId, getUserId(req));
        if (!roadmap || roadmap.status === "archived") return sendError(res, 404, "Active learning roadmap not found.");
        const startDate = new Date(req.body?.startDate);
        if (Number.isNaN(startDate.getTime())) return sendError(res, 400, "A valid startDate is required.");
        startDate.setHours(0, 0, 0, 0);
        const tasks = await learningTaskModel.find({ roadmap: roadmap._id, user: getUserId(req) });
        const dates = rescheduleTasks(tasks, startDate);
        await Promise.all([...dates.entries()].map(([taskId, task]) => learningTaskModel.updateOne({ _id: taskId }, { $set: { week: task.week, day: task.day, scheduledDate: task.scheduledDate } })));
        roadmap.settings.startDate = startDate;
        await roadmap.save();
        return getLearningRoadmapController(req, res);
    } catch {
        return sendError(res, 500, "Failed to reschedule learning roadmap.");
    }
}

module.exports = {
    createLearningRoadmapController,
    listLearningRoadmapsController,
    getLearningRoadmapController,
    updateLearningRoadmapController,
    updateLearningTaskController,
    rescheduleLearningRoadmapController,
};
