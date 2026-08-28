const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
    resourceId: { type: String, required: true },
    title: { type: String, required: true },
    provider: { type: String, required: true },
    url: { type: String, required: true },
    estimatedMinutes: { type: Number, required: true, min: 1 },
}, { _id: false });

const learningTaskSchema = new mongoose.Schema({
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: "LearningRoadmap", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    week: { type: Number, required: true, min: 1 },
    day: { type: Number, required: true, min: 1, max: 7 },
    scheduledDate: { type: Date, required: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, maxlength: 700 },
    category: { type: String, enum: ["skill_gap", "ats_evidence", "technical", "behavioral", "portfolio"], required: true },
    taskType: { type: String, enum: ["learn", "practice", "build", "review", "mock_interview"], required: true },
    priority: { type: String, enum: ["high", "medium", "low"], required: true, index: true },
    estimatedMinutes: { type: Number, required: true, min: 15, max: 480 },
    status: { type: String, enum: ["todo", "in_progress", "completed", "skipped"], default: "todo", index: true },
    completedAt: { type: Date, default: null },
    actualMinutes: { type: Number, min: 0, max: 1440, default: null },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    confidence: { type: Number, min: 1, max: 5, default: null },
    resources: [resourceSchema],
    sourceEvidence: {
        skillGap: { type: String, default: null },
        atsRequirement: { type: String, default: null },
        interviewDay: { type: Number, default: null },
    },
}, { timestamps: true });

learningTaskSchema.index({ roadmap: 1, week: 1, day: 1, priority: 1, _id: 1 });
learningTaskSchema.index({ user: 1, roadmap: 1, status: 1 });

module.exports = mongoose.model("LearningTask", learningTaskSchema);
