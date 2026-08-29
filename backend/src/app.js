const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const mongoose = require("mongoose");
const { getAllowedOrigins } = require("./config/security");
const { verifyTrustedOrigin } = require("./middlewares/csrf.middleware");

const app = express();
const allowedOrigins = getAllowedOrigins();

if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Request origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}))
app.use(verifyTrustedOrigin);

app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    return res.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? "ok" : "unavailable",
        database: databaseConnected ? "connected" : "disconnected",
    });
});


/* require all the routes here  */
const authRouter = require('./routes/auth.routes');
const interviewRouter = require("./routes/interview.routes")
const atsAnalysisRouter = require("./routes/atsAnalysis.routes");
const learningRoadmapRouter = require("./routes/learningRoadmap.routes");
const jobComparisonRouter = require("./routes/jobComparison.routes");
const resumeAtsRouter = require("./routes/resumeAts.routes");

/* use all the routes here */
app.use('/api/auth', authRouter); 
app.use("/api/interview", interviewRouter)
app.use("/api/ats-analysis", atsAnalysisRouter)
app.use("/api/learning-roadmaps", learningRoadmapRouter)
app.use("/api/job-comparisons", jobComparisonRouter)
app.use("/api/resume-ats", resumeAtsRouter)

app.use((error, req, res, next) => {
    if (error.message === "Request origin is not allowed by CORS.") {
        return res.status(403).json({ message: error.message });
    }

    if (error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Request payload is too large." });
    }

    console.error("Unhandled application error:", error);
    return res.status(error.status || 500).json({ message: "Internal Server Error" });
});


module.exports = app;
