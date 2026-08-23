const assert = require("node:assert/strict");
const test = require("node:test");

const interviewReportModel = require("../src/models/interviewReport.model");
const {
    DEFAULT_REPORT_PAGE_SIZE,
    MAX_REPORT_PAGE_SIZE,
    buildCursorFilter,
    decodeReportCursor,
    encodeReportCursor,
    parseReportPageLimit,
} = require("../src/services/report-pagination.service");

test("uses a bounded default history page size", () => {
    assert.equal(parseReportPageLimit(undefined), DEFAULT_REPORT_PAGE_SIZE);
    assert.equal(parseReportPageLimit("50"), MAX_REPORT_PAGE_SIZE);
    assert.throws(() => parseReportPageLimit("0"), /limit must be between/);
    assert.throws(() => parseReportPageLimit("51"), /limit must be between/);
    assert.throws(() => parseReportPageLimit("many"), /limit must be a positive integer/);
});

test("encodes a stable cursor and creates a seek-pagination filter", () => {
    const report = {
        _id: "67d1240ec1d0a45b5534a2f1",
        createdAt: new Date("2026-08-24T10:30:00.000Z"),
    };
    const cursor = decodeReportCursor(encodeReportCursor(report));
    const filter = buildCursorFilter(cursor);

    assert.equal(cursor.createdAt.toISOString(), report.createdAt.toISOString());
    assert.equal(cursor.id.toString(), report._id);
    assert.deepEqual(filter, {
        $or: [
            { createdAt: { $lt: report.createdAt } },
            { createdAt: report.createdAt, _id: { $lt: cursor.id } },
        ],
    });
});

test("rejects malformed report cursors", () => {
    assert.throws(() => decodeReportCursor("invalid"), /cursor is invalid/);
});

test("indexes report history for cursor pagination", () => {
    const indexes = interviewReportModel.schema.indexes();

    assert.ok(indexes.some(([fields]) => (
        fields.user === 1
        && fields.createdAt === -1
        && fields._id === -1
    )));
});
