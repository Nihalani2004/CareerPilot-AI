const mongoose = require("mongoose");

const DEFAULT_REPORT_PAGE_SIZE = 12;
const MAX_REPORT_PAGE_SIZE = 50;

function createPaginationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function parseReportPageLimit(value) {
    if (value === undefined) {
        return DEFAULT_REPORT_PAGE_SIZE;
    }

    if (!/^\d+$/.test(String(value))) {
        throw createPaginationError("limit must be a positive integer.");
    }

    const limit = Number(value);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_REPORT_PAGE_SIZE) {
        throw createPaginationError(`limit must be between 1 and ${MAX_REPORT_PAGE_SIZE}.`);
    }

    return limit;
}

function encodeReportCursor(report) {
    return Buffer.from(JSON.stringify({
        createdAt: report.createdAt.toISOString(),
        id: report._id.toString(),
    })).toString("base64url");
}

function decodeReportCursor(cursor) {
    if (!cursor) {
        return null;
    }

    try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        const createdAt = new Date(decoded.createdAt);

        if (Number.isNaN(createdAt.getTime()) || !mongoose.isValidObjectId(decoded.id)) {
            throw new Error("Invalid cursor.");
        }

        return { createdAt, id: new mongoose.Types.ObjectId(decoded.id) };
    } catch {
        throw createPaginationError("cursor is invalid.");
    }
}

function buildCursorFilter(cursor) {
    if (!cursor) {
        return {};
    }

    return {
        $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ],
    };
}

module.exports = {
    DEFAULT_REPORT_PAGE_SIZE,
    MAX_REPORT_PAGE_SIZE,
    buildCursorFilter,
    decodeReportCursor,
    encodeReportCursor,
    parseReportPageLimit,
};
