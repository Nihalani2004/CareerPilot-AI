const mongoose = require("mongoose");

const requirementSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    importance: { type: String, enum: ["high", "medium", "low"], required: true },
    status: { type: String, enum: ["matched", "missing"], required: true },
    evidence: { type: String, default: null },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    status: { type: String, enum: ["strong", "needs_attention", "missing"], required: true },
    insight: { type: String, required: true },
}, { _id: false });

const auditSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    status: { type: String, enum: ["pass", "warning", "action"], required: true },
    detail: { type: String, required: true },
}, { _id: false });

const suggestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    section: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], required: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    relatedKeywords: [{ type: String }],
    status: { type: String, enum: ["open", "saved", "applied", "dismissed"], default: "open" },
}, { _id: false });

const atsAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
    },
    interviewReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true,
    },
    sourceHash: {
        type: String,
        required: true,
    },
    analysisVersion: {
        type: Number,
        required: true,
    },
    targetRole: {
        type: String,
        required: true,
    },
    metrics: {
        overallScore: { type: Number, min: 0, max: 100, required: true },
        keywordAlignment: { type: Number, min: 0, max: 100, required: true },
        skillAlignment: { type: Number, min: 0, max: 100, required: true },
        evidenceQuality: { type: Number, min: 0, max: 100, required: true },
        completeness: { type: Number, min: 0, max: 100, required: true },
        existingMatchScore: { type: Number, min: 0, max: 100, default: null },
    },
    requirements: [requirementSchema],
    keywordCoverage: [{
        word: { type: String, required: true },
        count: { type: Number, required: true },
        _id: false,
    }],
    sections: [sectionSchema],
    auditChecklist: [auditSchema],
    suggestions: [suggestionSchema],
}, {
    timestamps: true,
});

atsAnalysisSchema.index({ user: 1, interviewReport: 1 }, { unique: true });
atsAnalysisSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("AtsAnalysis", atsAnalysisSchema);
