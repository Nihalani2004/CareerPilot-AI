const atsAnalysisModel = require("../models/atsAnalysis.model");
const interviewReportModel = require("../models/interviewReport.model");
const { buildAtsAnalysis, createAtsSourceHash } = require("../services/ats-analysis.service");

function getUserId(req) {
    return req.user.id || req.user._id;
}

async function findOwnedReport(interviewReportId, userId) {
    return interviewReportModel.findOne({
        _id: interviewReportId,
        user: userId,
    }).select("resume selfDescription jobDescription title skillGaps matchScore").lean();
}

async function getAtsAnalysisController(req, res) {
    try {
        const analysis = await atsAnalysisModel.findOne({
            interviewReport: req.params.interviewReportId,
            user: getUserId(req),
        }).lean();

        if (!analysis) {
            return res.status(404).json({ message: "ATS analysis has not been created for this report." });
        }

        return res.status(200).json({ message: "ATS analysis fetched successfully.", analysis });
    } catch (error) {
        console.error("Get ATS Analysis Error:", error);
        return res.status(500).json({ message: "Failed to fetch ATS analysis." });
    }
}

async function createAtsAnalysisController(req, res) {
    try {
        const userId = getUserId(req);
        const interviewReport = await findOwnedReport(req.params.interviewReportId, userId);

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." });
        }

        const sourceHash = createAtsSourceHash(interviewReport);
        const existingAnalysis = await atsAnalysisModel.findOne({
            interviewReport: interviewReport._id,
            user: userId,
        });

        if (existingAnalysis && existingAnalysis.sourceHash === sourceHash) {
            return res.status(200).json({
                message: "Existing ATS analysis returned.",
                cached: true,
                analysis: existingAnalysis,
            });
        }

        const generatedAnalysis = buildAtsAnalysis(interviewReport);
        const analysis = await atsAnalysisModel.findOneAndUpdate(
            { user: userId, interviewReport: interviewReport._id },
            {
                $set: {
                    ...generatedAnalysis,
                    user: userId,
                    interviewReport: interviewReport._id,
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(existingAnalysis ? 200 : 201).json({
            message: "ATS analysis generated successfully.",
            cached: false,
            analysis,
        });
    } catch (error) {
        console.error("Create ATS Analysis Error:", error);
        return res.status(500).json({ message: "Failed to generate ATS analysis." });
    }
}

async function updateAtsSuggestionController(req, res) {
    try {
        const { status } = req.body || {};
        const validStatuses = new Set(["open", "saved", "applied", "dismissed"]);
        if (!validStatuses.has(status)) {
            return res.status(400).json({ message: "Suggestion status is invalid." });
        }

        const analysis = await atsAnalysisModel.findOne({
            _id: req.params.analysisId,
            user: getUserId(req),
        });

        if (!analysis) {
            return res.status(404).json({ message: "ATS analysis not found." });
        }

        const suggestion = analysis.suggestions.find((item) => item.id === req.params.suggestionId);
        if (!suggestion) {
            return res.status(404).json({ message: "Suggestion not found." });
        }

        suggestion.status = status;
        await analysis.save();

        return res.status(200).json({
            message: "Suggestion updated successfully.",
            suggestion,
        });
    } catch (error) {
        console.error("Update ATS Suggestion Error:", error);
        return res.status(500).json({ message: "Failed to update suggestion." });
    }
}

module.exports = {
    createAtsAnalysisController,
    getAtsAnalysisController,
    updateAtsSuggestionController,
};
