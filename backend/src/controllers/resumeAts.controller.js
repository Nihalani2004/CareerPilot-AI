const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const resumeAtsScanModel = require("../models/resumeAtsScan.model");
const { ANALYSIS_VERSION, buildResumeAtsAnalysis, createContentHash } = require("../services/resume-ats.service");
const { buildCursorFilter, decodeReportCursor, encodeReportCursor, parseReportPageLimit } = require("../services/report-pagination.service");

function getUserId(req) { return req.user.id || req.user._id; }
function sendError(res, status, message) { return res.status(status).json({ message }); }
function isPdf(file) { return file?.mimetype === "application/pdf" || /\.pdf$/i.test(file?.originalname || ""); }
function isDocx(file) { return file?.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.docx$/i.test(file?.originalname || ""); }
function isSupportedResume(file) { return isPdf(file) || isDocx(file); }
function displayNameFrom(fileName) { return String(fileName || "Resume").replace(/\.pdf$/i, "").replace(/[._-]+/g, " ").trim().slice(0, 120) || "Resume"; }

async function parsePdfResume(buffer) {
    const parser = new pdfParse.PDFParse(Uint8Array.from(buffer));
    try {
        const result = await parser.getText();
        return String(result.text || "");
    } finally {
        await parser.destroy?.();
    }
}

async function parseResume(file) {
    if (isDocx(file)) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return String(result.value || "");
    }
    return parsePdfResume(file.buffer);
}

async function getOwnedScan(scanId, userId) {
    if (!mongoose.isValidObjectId(scanId)) return null;
    return resumeAtsScanModel.findOne({ _id: scanId, user: userId });
}

async function createResumeAtsScanController(req, res) {
    try {
        if (!req.file?.buffer) return sendError(res, 400, "Upload a PDF or DOCX resume to run an ATS check.");
        if (!isSupportedResume(req.file)) return sendError(res, 400, "Only PDF and DOCX resumes are supported for ATS checking.");
        const userId = getUserId(req);
        const contentHash = createContentHash(req.file.buffer);
        const existing = await resumeAtsScanModel.findOne({ user: userId, contentHash, analysisVersion: ANALYSIS_VERSION });
        if (existing) return res.status(200).json({ message: "Existing ATS scan returned.", cached: true, scan: existing });

        const extractedText = await parseResume(req.file);
        const result = buildResumeAtsAnalysis(extractedText);
        const requestedName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 120) : "";
        const scan = await resumeAtsScanModel.create({
            user: userId,
            displayName: requestedName || displayNameFrom(req.file.originalname),
            originalFileName: String(req.file.originalname || "resume.pdf").slice(0, 255),
            fileSize: req.file.size,
            contentHash,
            analysisVersion: ANALYSIS_VERSION,
            result,
        });
        return res.status(201).json({ message: "Resume ATS scan created successfully.", cached: false, scan });
    } catch (error) {
        console.error("Create Resume ATS Scan Error:", error);
        return sendError(res, 422, "We could not read this resume. Upload a text-based PDF or a valid DOCX file and try again.");
    }
}

async function listResumeAtsScansController(req, res) {
    try {
        const limit = parseReportPageLimit(req.query.limit);
        const cursor = decodeReportCursor(req.query.cursor);
        const query = { user: getUserId(req), ...buildCursorFilter(cursor) };
        const scans = await resumeAtsScanModel.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1)
            .select("displayName originalFileName fileSize contentHash analysisVersion result.overallScore result.label result.generatedAt createdAt updatedAt").lean();
        const hasNextPage = scans.length > limit;
        const items = hasNextPage ? scans.slice(0, limit) : scans;
        return res.status(200).json({ message: "Resume ATS scans fetched successfully.", scans: items, pagination: { limit, hasNextPage, nextCursor: hasNextPage ? encodeReportCursor(items.at(-1)) : null } });
    } catch (error) {
        return sendError(res, 500, "Failed to fetch resume ATS scans.");
    }
}

async function getResumeAtsScanController(req, res) {
    try {
        const scan = await getOwnedScan(req.params.scanId, getUserId(req));
        if (!scan) return sendError(res, 404, "Resume ATS scan not found.");
        return res.status(200).json({ message: "Resume ATS scan fetched successfully.", scan });
    } catch (error) {
        return sendError(res, 500, "Failed to fetch resume ATS scan.");
    }
}

async function compareResumeAtsScansController(req, res) {
    try {
        const userId = getUserId(req);
        const [baseScan, comparedScan] = await Promise.all([getOwnedScan(req.params.scanId, userId), getOwnedScan(req.params.otherScanId, userId)]);
        if (!baseScan || !comparedScan) return sendError(res, 404, "One or both resume ATS scans were not found.");
        const byKey = (scan) => new Map(scan.result.scores.map((item) => [item.key, item]));
        const baseScores = byKey(baseScan);
        const scoreChanges = comparedScan.result.scores.map((item) => ({ key: item.key, label: item.label, before: baseScores.get(item.key)?.score || 0, after: item.score, change: item.score - (baseScores.get(item.key)?.score || 0) }));
        const previousFindings = new Set(baseScan.result.findings.map((finding) => finding.id));
        const currentFindings = new Set(comparedScan.result.findings.map((finding) => finding.id));
        return res.status(200).json({ message: "Resume ATS scans compared successfully.", comparison: {
            before: { id: baseScan._id, displayName: baseScan.displayName, score: baseScan.result.overallScore },
            after: { id: comparedScan._id, displayName: comparedScan.displayName, score: comparedScan.result.overallScore },
            overallChange: comparedScan.result.overallScore - baseScan.result.overallScore,
            scoreChanges,
            resolvedFindingIds: [...previousFindings].filter((id) => !currentFindings.has(id)),
            newFindingIds: [...currentFindings].filter((id) => !previousFindings.has(id)),
        } });
    } catch (error) {
        return sendError(res, 500, "Failed to compare resume ATS scans.");
    }
}

async function deleteResumeAtsScanController(req, res) {
    try {
        const scan = await resumeAtsScanModel.findOneAndDelete({ _id: req.params.scanId, user: getUserId(req) });
        if (!scan) return sendError(res, 404, "Resume ATS scan not found.");
        return res.status(200).json({ message: "Resume ATS scan deleted successfully." });
    } catch (error) {
        return sendError(res, 500, "Failed to delete resume ATS scan.");
    }
}

module.exports = { createResumeAtsScanController, listResumeAtsScansController, getResumeAtsScanController, compareResumeAtsScansController, deleteResumeAtsScanController };
