const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const { atsAnalysisRateLimiter } = require("../middlewares/ats-analysis-rate-limit.middleware");
const {
    createAtsAnalysisController,
    getAtsAnalysisController,
    updateAtsSuggestionController,
} = require("../controllers/atsAnalysis.controller");

const atsAnalysisRouter = express.Router();

atsAnalysisRouter.get("/:interviewReportId", authUser, getAtsAnalysisController);
atsAnalysisRouter.post("/:interviewReportId", authUser, atsAnalysisRateLimiter, createAtsAnalysisController);
atsAnalysisRouter.patch("/:analysisId/suggestions/:suggestionId", authUser, updateAtsSuggestionController);

module.exports = atsAnalysisRouter;
