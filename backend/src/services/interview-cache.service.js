const crypto = require("node:crypto");
const interviewReportModel = require("../models/interviewReport.model");

const inFlightInterviewGenerations = new Map();

function createInterviewInputHash({ resume, selfDescription, jobDescription }) {
    const normalizedInput = JSON.stringify({
        resume: resume.trim(),
        selfDescription: selfDescription.trim(),
        jobDescription: jobDescription.trim(),
    });

    return crypto.createHash("sha256").update(normalizedInput).digest("hex");
}

async function findCachedInterviewReport({ userId, inputHash }) {
    return interviewReportModel
        .findOne({ user: userId, inputHash })
        .sort({ createdAt: -1 });
}

async function getOrCreateInterviewReport({ userId, inputHash, generateReport }) {
    const cachedReport = await findCachedInterviewReport({ userId, inputHash });
    if (cachedReport) {
        return { interviewReport: cachedReport, reused: true };
    }

    const key = `${userId}:${inputHash}`;
    const activeGeneration = inFlightInterviewGenerations.get(key);

    if (activeGeneration) {
        return activeGeneration;
    }

    const generation = (async () => {
        try {
            const interviewReport = await generateReport();
            return { interviewReport, reused: false };
        } catch (error) {
            if (error?.code !== 11000) {
                throw error;
            }

            const reportCreatedByAnotherInstance = await findCachedInterviewReport({ userId, inputHash });
            if (reportCreatedByAnotherInstance) {
                return { interviewReport: reportCreatedByAnotherInstance, reused: true };
            }

            throw error;
        } finally {
            inFlightInterviewGenerations.delete(key);
        }
    })();

    inFlightInterviewGenerations.set(key, generation);
    return generation;
}

module.exports = {
    createInterviewInputHash,
    getOrCreateInterviewReport,
};
