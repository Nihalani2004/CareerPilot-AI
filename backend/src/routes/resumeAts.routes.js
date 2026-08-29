const express = require("express");
const upload = require("../middlewares/file.middleware");
const { authUser } = require("../middlewares/auth.middleware");
const { resumeAtsRateLimiter } = require("../middlewares/resume-ats-rate-limit.middleware");
const controller = require("../controllers/resumeAts.controller");

const resumeAtsRouter = express.Router();

resumeAtsRouter.post("/scans", authUser, resumeAtsRateLimiter, upload.single("resume"), controller.createResumeAtsScanController);
resumeAtsRouter.get("/scans", authUser, controller.listResumeAtsScansController);
resumeAtsRouter.get("/scans/:scanId/compare/:otherScanId", authUser, controller.compareResumeAtsScansController);
resumeAtsRouter.get("/scans/:scanId", authUser, controller.getResumeAtsScanController);
resumeAtsRouter.delete("/scans/:scanId", authUser, controller.deleteResumeAtsScanController);

module.exports = resumeAtsRouter;
