const mongoose = require("mongoose");

const jobDescriptionSchema = new mongoose.Schema({
    companyName: { type: String, trim: true, maxlength: 120, default: "" },
    roleTitle: { type: String, trim: true, maxlength: 160, required: true },
    sourceUrl: { type: String, trim: true, maxlength: 500, default: "" },
    content: { type: String, required: true, maxlength: 8000 },
    contentHash: { type: String, required: true },
}, { timestamps: true });

const requirementSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    frequency: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    importance: { type: String, enum: ["critical", "high", "emerging", "optional"], required: true },
    descriptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
    _id: false,
});

const responsibilitySchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    frequency: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    descriptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
    _id: false,
});

const gapSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    demandLevel: { type: String, enum: ["critical", "high", "emerging", "optional"], required: true },
    status: { type: String, enum: ["matched", "missing"], required: true },
    evidence: { type: String, default: null },
    _id: false,
});

const jobComparisonSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    targetRole: { type: String, required: true, trim: true, maxlength: 160 },
    experienceLevel: { type: String, trim: true, maxlength: 80, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    sourceInterviewReport: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport", default: null },
    jobDescriptions: {
        type: [jobDescriptionSchema],
        validate: [(value) => value.length >= 2 && value.length <= 10, "A comparison must contain between 2 and 10 job descriptions."],
    },
    analysis: {
        sourceHash: { type: String, required: true },
        totalDescriptions: { type: Number, required: true, min: 2, max: 10 },
        requirements: [requirementSchema],
        repeatedSkills: [requirementSchema],
        highDemandTools: [requirementSchema],
        repeatedResponsibilities: [responsibilitySchema],
        readiness: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            coreSkillCoverage: { type: Number, min: 0, max: 100, default: 0 },
            toolCoverage: { type: Number, min: 0, max: 100, default: 0 },
            responsibilityAlignment: { type: Number, min: 0, max: 100, default: 0 },
            evidenceQuality: { type: Number, min: 0, max: 100, default: 0 },
            hasProfile: { type: Boolean, default: false },
        },
        gaps: [gapSchema],
        generatedAt: { type: Date, default: Date.now },
    },
}, { timestamps: true });

jobComparisonSchema.index({ user: 1, updatedAt: -1, _id: -1 });
jobComparisonSchema.index({ user: 1, "analysis.sourceHash": 1 });

module.exports = mongoose.model("JobComparison", jobComparisonSchema);
