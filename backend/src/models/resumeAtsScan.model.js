const mongoose = require("mongoose");

const scoreItemSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true, maxlength: 320 },
}, { _id: false });

const findingSchema = new mongoose.Schema({
    id: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["critical", "high", "medium", "low"], required: true },
    title: { type: String, required: true, maxlength: 160 },
    detail: { type: String, required: true, maxlength: 500 },
    scoreImpact: { type: Number, required: true, min: 0, max: 25 },
    evidence: { type: String, default: null, maxlength: 220 },
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
    focus: { type: String, required: true, maxlength: 160 },
    priority: { type: String, enum: ["critical", "high", "medium", "low"], required: true },
    why: { type: String, required: true, maxlength: 320 },
    action: { type: String, required: true, maxlength: 500 },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    present: { type: Boolean, required: true },
}, { _id: false });

const resumeAtsScanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    displayName: { type: String, required: true, trim: true, maxlength: 120 },
    originalFileName: { type: String, required: true, trim: true, maxlength: 255 },
    fileSize: { type: Number, required: true, min: 1 },
    contentHash: { type: String, required: true },
    analysisVersion: { type: Number, required: true },
    result: {
        overallScore: { type: Number, required: true, min: 0, max: 100 },
        label: { type: String, required: true },
        disclaimer: { type: String, required: true },
        scores: [scoreItemSchema],
        parserHealth: {
            textExtracted: { type: Boolean, required: true },
            characterCount: { type: Number, required: true },
            wordCount: { type: Number, required: true },
            lineCount: { type: Number, required: true },
            fragmentedLineRatio: { type: Number, required: true, min: 0, max: 100 },
            preview: { type: String, required: true, maxlength: 1800 },
        },
        contacts: {
            email: { type: Boolean, required: true },
            phone: { type: Boolean, required: true },
            linkedin: { type: Boolean, required: true },
            githubOrPortfolio: { type: Boolean, required: true },
        },
        sections: [sectionSchema],
        skills: [{ type: String, maxlength: 80 }],
        findings: [findingSchema],
        recommendations: [recommendationSchema],
        generatedAt: { type: Date, required: true },
    },
}, { timestamps: true });

resumeAtsScanSchema.index({ user: 1, contentHash: 1, analysisVersion: 1 }, { unique: true });
resumeAtsScanSchema.index({ user: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model("ResumeAtsScan", resumeAtsScanSchema);
