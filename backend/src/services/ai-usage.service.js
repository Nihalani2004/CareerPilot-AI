const aiUsageModel = require("../models/aiUsage.model");
const { getAiUsageConfig } = require("../config/ai-usage");

const ACTIONS = {
    INTERVIEW_REPORT: "interview_report",
    RESUME_PDF: "resume_pdf",
};

class DailyAiUsageLimitError extends Error {
    constructor() {
        super("Daily AI generation limit reached. Please try again tomorrow.");
        this.name = "DailyAiUsageLimitError";
        this.statusCode = 429;
    }
}

function getUtcDayBounds(now = new Date()) {
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const expiresAt = new Date(periodStart);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 2);
    return { periodStart, expiresAt };
}

function getDailyLimit(action) {
    const config = getAiUsageConfig();

    if (action === ACTIONS.INTERVIEW_REPORT) {
        return config.report.dailyLimit;
    }

    if (action === ACTIONS.RESUME_PDF) {
        return config.resumePdf.dailyLimit;
    }

    throw new Error("Unsupported AI usage action.");
}

async function reserveDailyAiUsage({ userId, action }) {
    const limit = getDailyLimit(action);
    const { periodStart, expiresAt } = getUtcDayBounds();
    const filter = { user: userId, action, periodStart, count: { $lt: limit } };

    let usage = await aiUsageModel.findOneAndUpdate(
        filter,
        { $inc: { count: 1 } },
        { new: true }
    );

    if (usage) {
        return usage;
    }

    try {
        usage = await aiUsageModel.create({
            user: userId,
            action,
            periodStart,
            expiresAt,
            count: 1,
        });
        return usage;
    } catch (error) {
        if (error?.code !== 11000) {
            throw error;
        }

        usage = await aiUsageModel.findOneAndUpdate(
            filter,
            { $inc: { count: 1 } },
            { new: true }
        );

        if (usage) {
            return usage;
        }
    }

    throw new DailyAiUsageLimitError();
}

module.exports = {
    ACTIONS,
    DailyAiUsageLimitError,
    getUtcDayBounds,
    reserveDailyAiUsage,
};
