const mongoose = require("mongoose");

const learningRoadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active", index: true },
    source: {
        interviewReport: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport", required: true },
        atsAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: "AtsAnalysis", default: null },
        targetRole: { type: String, required: true, trim: true, maxlength: 160 },
        jobDescriptionHash: { type: String, required: true },
        reportCreatedAt: { type: Date, required: true },
    },
    settings: {
        durationWeeks: { type: Number, required: true, min: 1, max: 6 },
        hoursPerWeek: { type: Number, required: true, min: 1, max: 40 },
        intensity: { type: String, enum: ["light", "balanced", "intensive"], default: "balanced" },
        startDate: { type: Date, required: true },
        focusAreas: [{ type: String, enum: ["skill_gaps", "ats_evidence", "technical_interview", "behavioral_interview", "portfolio"] }],
    },
    summary: {
        criticalGaps: [{ type: String, maxlength: 120 }],
        estimatedTotalMinutes: { type: Number, required: true, min: 0 },
        taskCount: { type: Number, required: true, min: 0 },
    },
    readiness: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        weightedCompletion: { type: Number, min: 0, max: 100, default: 0 },
        highPriorityCompletion: { type: Number, min: 0, max: 100, default: 0 },
        scheduleAdherence: { type: Number, min: 0, max: 100, default: 0 },
        calculatedAt: { type: Date, default: Date.now },
    },
    sourceHash: { type: String, required: true },
    roadmapVersion: { type: Number, default: 1 },
}, { timestamps: true });

learningRoadmapSchema.index({ user: 1, updatedAt: -1, _id: -1 });
learningRoadmapSchema.index({ user: 1, sourceHash: 1 });

module.exports = mongoose.model("LearningRoadmap", learningRoadmapSchema);
