const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    action: {
        type: String,
        enum: ["interview_report", "resume_pdf"],
        required: true,
    },
    periodStart: {
        type: Date,
        required: true,
    },
    count: {
        type: Number,
        default: 0,
        min: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

aiUsageSchema.index({ user: 1, action: 1, periodStart: 1 }, { unique: true });
aiUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const aiUsageModel = mongoose.model("AiUsage", aiUsageSchema);

module.exports = aiUsageModel;
