const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const controller = require("../controllers/jobComparison.controller");

const jobComparisonRouter = express.Router();

jobComparisonRouter.post("/", authUser, controller.createJobComparisonController);
jobComparisonRouter.get("/", authUser, controller.listJobComparisonsController);
jobComparisonRouter.get("/:comparisonId", authUser, controller.getJobComparisonController);
jobComparisonRouter.patch("/:comparisonId", authUser, controller.updateJobComparisonController);
jobComparisonRouter.delete("/:comparisonId", authUser, controller.deleteJobComparisonController);
jobComparisonRouter.post("/:comparisonId/analyze", authUser, controller.analyzeJobComparisonController);
jobComparisonRouter.post("/:comparisonId/job-descriptions", authUser, controller.addJobDescriptionController);
jobComparisonRouter.patch("/:comparisonId/job-descriptions/:jobDescriptionId", authUser, controller.updateJobDescriptionController);
jobComparisonRouter.delete("/:comparisonId/job-descriptions/:jobDescriptionId", authUser, controller.deleteJobDescriptionController);

module.exports = jobComparisonRouter;
