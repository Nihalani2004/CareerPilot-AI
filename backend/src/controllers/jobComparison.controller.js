const mongoose = require("mongoose");
const jobComparisonModel = require("../models/jobComparison.model");
const interviewReportModel = require("../models/interviewReport.model");
const { createJobComparisonAnalysis, hashJobDescription } = require("../services/job-comparison.service");
const { buildCursorFilter, decodeReportCursor, encodeReportCursor, parseReportPageLimit } = require("../services/report-pagination.service");

function getUserId(req) {
    return req.user.id || req.user._id;
}

function sendError(res, status, message) {
    return res.status(status).json({ message });
}

function validUrl(value) {
    if (!value) return true;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function sanitizeJobDescription(input) {
    const companyName = String(input?.companyName || "").trim();
    const roleTitle = String(input?.roleTitle || "").trim();
    const sourceUrl = String(input?.sourceUrl || "").trim();
    const content = String(input?.content || "").trim();
    if (!roleTitle || roleTitle.length > 160) throw new Error("Each roleTitle must be between 1 and 160 characters.");
    if (!content || content.length > 8000) throw new Error("Each job description must be between 1 and 8000 characters.");
    if (companyName.length > 120) throw new Error("companyName must be a maximum of 120 characters.");
    if (sourceUrl.length > 500 || !validUrl(sourceUrl)) throw new Error("sourceUrl must be a valid HTTP(S) URL.");
    return { companyName, roleTitle, sourceUrl, content, contentHash: hashJobDescription(content) };
}

async function getProfileForComparison(reportId, userId) {
    if (!reportId) return null;
    if (!mongoose.isValidObjectId(reportId)) throw new Error("sourceInterviewReport must be a valid report ID.");
    const profile = await interviewReportModel.findOne({ _id: reportId, user: userId }).select("resume selfDescription").lean();
    if (!profile) {
        const error = new Error("Source interview report not found.");
        error.statusCode = 404;
        throw error;
    }
    return profile;
}

async function refreshAnalysis(comparison, userId) {
    const profile = await getProfileForComparison(comparison.sourceInterviewReport, userId);
    const analysis = createJobComparisonAnalysis({ targetRole: comparison.targetRole, jobDescriptions: comparison.jobDescriptions, profile });
    comparison.analysis = analysis;
    await comparison.save();
    return comparison;
}

async function getOwnedComparison(comparisonId, userId) {
    if (!mongoose.isValidObjectId(comparisonId)) return null;
    return jobComparisonModel.findOne({ _id: comparisonId, user: userId });
}

async function createJobComparisonController(req, res) {
    try {
        const userId = getUserId(req);
        const { name, targetRole, experienceLevel = "", location = "", sourceInterviewReport, jobDescriptions } = req.body || {};
        if (typeof name !== "string" || !name.trim() || name.trim().length > 100) return sendError(res, 400, "name must be between 1 and 100 characters.");
        if (typeof targetRole !== "string" || !targetRole.trim() || targetRole.trim().length > 160) return sendError(res, 400, "targetRole must be between 1 and 160 characters.");
        if (!Array.isArray(jobDescriptions) || jobDescriptions.length < 2 || jobDescriptions.length > 10) return sendError(res, 400, "Add between 2 and 10 job descriptions.");
        if (String(experienceLevel).length > 80 || String(location).length > 120) return sendError(res, 400, "Comparison metadata is too long.");

        const descriptions = jobDescriptions.map((description) => ({
            _id: new mongoose.Types.ObjectId(),
            ...sanitizeJobDescription(description),
        }));
        if (new Set(descriptions.map((item) => item.contentHash)).size !== descriptions.length) return sendError(res, 400, "Add distinct job descriptions before comparing.");
        const profile = await getProfileForComparison(sourceInterviewReport, userId);
        const analysis = createJobComparisonAnalysis({ targetRole: targetRole.trim(), jobDescriptions: descriptions, profile });
        const comparison = await jobComparisonModel.create({ user: userId, name: name.trim(), targetRole: targetRole.trim(), experienceLevel: String(experienceLevel).trim(), location: String(location).trim(), sourceInterviewReport: sourceInterviewReport || null, jobDescriptions: descriptions, analysis });
        return res.status(201).json({ message: "Job comparison created successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 400, error.message || "Failed to create job comparison.");
    }
}

async function listJobComparisonsController(req, res) {
    try {
        const limit = parseReportPageLimit(req.query.limit);
        const cursor = decodeReportCursor(req.query.cursor);
        const query = { user: getUserId(req), ...buildCursorFilter(cursor) };
        if (req.query.search) query.$or = [{ name: { $regex: String(req.query.search).trim().slice(0, 80), $options: "i" } }, { targetRole: { $regex: String(req.query.search).trim().slice(0, 80), $options: "i" } }];
        const rows = await jobComparisonModel.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).select("-jobDescriptions.content").lean();
        const hasNextPage = rows.length > limit;
        const comparisons = hasNextPage ? rows.slice(0, limit) : rows;
        return res.status(200).json({ message: "Job comparisons fetched successfully.", comparisons, pagination: { limit, hasNextPage, nextCursor: hasNextPage ? encodeReportCursor(comparisons.at(-1)) : null } });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Failed to fetch job comparisons.");
    }
}

async function getJobComparisonController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        return res.status(200).json({ message: "Job comparison fetched successfully.", comparison });
    } catch {
        return sendError(res, 500, "Failed to fetch job comparison.");
    }
}

async function updateJobComparisonController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        const updates = {};
        for (const field of ["name", "targetRole", "experienceLevel", "location"]) {
            if (req.body?.[field] === undefined) continue;
            if (typeof req.body[field] !== "string") return sendError(res, 400, `${field} must be text.`);
            const value = req.body[field].trim();
            const limit = { name: 100, targetRole: 160, experienceLevel: 80, location: 120 }[field];
            if ((field === "name" || field === "targetRole") && !value) return sendError(res, 400, `${field} is required.`);
            if (value.length > limit) return sendError(res, 400, `${field} is too long.`);
            updates[field] = value;
        }
        if (req.body?.sourceInterviewReport !== undefined) {
            await getProfileForComparison(req.body.sourceInterviewReport || null, getUserId(req));
            updates.sourceInterviewReport = req.body.sourceInterviewReport || null;
        }
        if (!Object.keys(updates).length) return sendError(res, 400, "No valid comparison updates were provided.");
        Object.assign(comparison, updates);
        await refreshAnalysis(comparison, getUserId(req));
        return res.status(200).json({ message: "Job comparison updated successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 400, error.message || "Failed to update job comparison.");
    }
}

async function addJobDescriptionController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        if (comparison.jobDescriptions.length >= 10) return sendError(res, 400, "A comparison supports a maximum of 10 job descriptions.");
        const description = sanitizeJobDescription(req.body);
        if (comparison.jobDescriptions.some((item) => item.contentHash === description.contentHash)) return sendError(res, 400, "This job description is already in the comparison.");
        comparison.jobDescriptions.push(description);
        await refreshAnalysis(comparison, getUserId(req));
        return res.status(201).json({ message: "Job description added successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 400, error.message || "Failed to add job description.");
    }
}

async function updateJobDescriptionController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        const description = comparison.jobDescriptions.id(req.params.jobDescriptionId);
        if (!description) return sendError(res, 404, "Job description not found.");
        const sanitized = sanitizeJobDescription({ ...description.toObject(), ...req.body });
        if (comparison.jobDescriptions.some((item) => item._id.toString() !== description._id.toString() && item.contentHash === sanitized.contentHash)) return sendError(res, 400, "This job description is already in the comparison.");
        Object.assign(description, sanitized);
        await refreshAnalysis(comparison, getUserId(req));
        return res.status(200).json({ message: "Job description updated successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 400, error.message || "Failed to update job description.");
    }
}

async function deleteJobDescriptionController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        if (comparison.jobDescriptions.length <= 2) return sendError(res, 400, "Keep at least two job descriptions in a comparison.");
        const description = comparison.jobDescriptions.id(req.params.jobDescriptionId);
        if (!description) return sendError(res, 404, "Job description not found.");
        description.deleteOne();
        await refreshAnalysis(comparison, getUserId(req));
        return res.status(200).json({ message: "Job description removed successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Failed to remove job description.");
    }
}

async function analyzeJobComparisonController(req, res) {
    try {
        const comparison = await getOwnedComparison(req.params.comparisonId, getUserId(req));
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        await refreshAnalysis(comparison, getUserId(req));
        return res.status(200).json({ message: "Job comparison analysis refreshed successfully.", comparison });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Failed to analyze job comparison.");
    }
}

async function deleteJobComparisonController(req, res) {
    try {
        const comparison = await jobComparisonModel.findOneAndDelete({ _id: req.params.comparisonId, user: getUserId(req) });
        if (!comparison) return sendError(res, 404, "Job comparison not found.");
        return res.status(200).json({ message: "Job comparison deleted successfully." });
    } catch {
        return sendError(res, 500, "Failed to delete job comparison.");
    }
}

module.exports = { createJobComparisonController, listJobComparisonsController, getJobComparisonController, updateJobComparisonController, addJobDescriptionController, updateJobDescriptionController, deleteJobDescriptionController, analyzeJobComparisonController, deleteJobComparisonController };
