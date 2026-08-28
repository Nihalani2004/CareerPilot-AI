const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const controller = require("../controllers/learningRoadmap.controller");

const learningRoadmapRouter = express.Router();

learningRoadmapRouter.post("/", authUser, controller.createLearningRoadmapController);
learningRoadmapRouter.get("/", authUser, controller.listLearningRoadmapsController);
learningRoadmapRouter.get("/:roadmapId", authUser, controller.getLearningRoadmapController);
learningRoadmapRouter.patch("/:roadmapId", authUser, controller.updateLearningRoadmapController);
learningRoadmapRouter.post("/:roadmapId/reschedule", authUser, controller.rescheduleLearningRoadmapController);
learningRoadmapRouter.patch("/:roadmapId/tasks/:taskId", authUser, controller.updateLearningTaskController);

module.exports = learningRoadmapRouter;
